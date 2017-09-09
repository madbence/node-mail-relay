#!/bin/env node

const dns = require('dns');
const Server = require('smtp-server').SMTPServer;
const Connection = require('nodemailer/lib/smtp-connection');

const map = JSON.parse(process.env.MAIL_MAP);

const collect = stream => new Promise((resolve, reject) => {
  let buffer = Buffer.alloc(0);
  stream
    .on('data', chunk => buffer = Buffer.concat([buffer, chunk]))
    .once('error', reject)
    .once('end', () => resolve(buffer));
});

const resolveMx = address => new Promise((resolve, reject) => {
  dns.resolveMx(address, (err, exchanges) => {
    if (err) return reject(err);
    resolve(exchanges);
  });
});

async function validateRecipient(address, session) {
  console.log('Mail from %s to %s:', session.envelope.mailFrom.address, address.address);
  for (const key of Object.keys(map)) {
    if (key === address.address) {
      console.log(' %s is allowed, proceed...', address.address);
      return true;
    }
  }
  console.log(' %s is not allowed, mail rejected!', address.address);
  return false;
}

async function forward(stream, session, translate) {
  const buffer = await collect(stream);
  for (const a of session.envelope.rcptTo) {
    const address = translate ? map[a.address] : a.address;
    if (translate) {
      console.log(' Mail to %s will be sent to %s', a.address, address);
    }
    console.log(' Sending mail to %s', address);
    const domain = address.match(/@(.*)$/)[1];
    const exchanges = await resolveMx(domain);
    if (!exchanges[0]) {
      console.log(' No MX found for %s', domain);
      continue;
    }
    console.log(' %s is handled by %s', domain, exchanges[0].exchange);

    const conn = new Connection({
      host: exchanges[0].exchange,
      port: 25,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await new Promise((resolve, reject) => {
      conn.connect(() => {
        conn.send({
          mailFrom: session.envelope.mailFrom.address,
          to: address,
        }, buffer, (err, info) => {
          conn.quit();
          if (err) return reject(err)
          resolve(info);
        });
      });
    });

    if (result.accepted.length) {
      console.log(' mail to %s accepted.', result.accepted[0]);
    }
    if (result.rejected.length) {
      console.log(' mail to %s rejected. %s', result.rejected[0], result.response);
    }
  }
}

const server = new Server({
  secure: false,
  authOptional: true,
  onRcptTo: (address, session, cb) => {
    validateRecipient(address, session)
      .then(valid => {
        if (valid) {
          return cb();
        }
        return cb(new Error('Address not allowed!'));
      });
  },
  onData: (stream, session, cb) => {
    forward(stream, session, true).then(cb, cb);
  },
});

server.on('error', err => console.error('ERR', err));

const server2 = new Server({
  secure: false,
  authOptional: false,
  onAuth: (auth, session, cb) => {
    if (auth.username === process.env.AUTH_USER && auth.password === process.env.AUTH_PASS) {
      return cb(null, { user: auth.username });
    }
    cb(new Error('Bad user or password'));
  },
  onData: (stream, session, cb) => {
    console.log('%s wants to send a mail!', session.envelope.mailFrom.address);
    forward(stream, session).then(cb, cb);
  },
});

server2.on('error', err => console.error('ERR', err));

server.listen(25, '0.0.0.0', () => {
  server2.listen(587, '0.0.0.0', () => {
    if (process.env.SETUID) {
      process.setuid(+process.env.SETUID);
    }
  });
});

