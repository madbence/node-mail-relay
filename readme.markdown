# node-mail-relay

> use gmail with your custom domain for free

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
