# node-mail-relay

> use gmail with your custom domain for free

- SMTP server on port 587 for outgoing emails (set up your mail client to use this as a custom SMTP server)
- SMTP server on port 25 for incoming emails (forwards emails to you based on `MAIL_MAP`)

## _warning_

This stuff is _experimental_. Use with caution.

## install

```sh
$ npm i -g mail-relay
```

## usage

```sh
$ mail-relay
```

## configuration

With env vars.

### `AUTH_USER`

User for the outgoing emails.

### `AUTH_PASS`

Password for the outgoing emails.

### `MAIL_MAP`

Address mapping

```js
{
  "john@doe.com": "johndoe@gmail.com"
}
```

## license

MIT
