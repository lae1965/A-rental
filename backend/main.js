import http from 'http';
import crypto from 'crypto';
import axios from 'axios';
import BP from 'bp-api';

const _BP = BP.default;
const PORT = 5555;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept',
};
const secret = 'ze7Kf1';

const bp = new _BP(
  'test-a-prokat1965.bpium.ru',
  'lae1965@yandex.ru',
  'Lae1965'
);

const getBody = (req, cb) => {
  let body = '';
  req.on('data', (chank) => (body += chank));
  req.on('end', () => {
    cb(body);
  });
};

const isRequestValid = (req, body) => {
  const hmac = crypto.createHmac('md5', secret);
  hmac.setEncoding('base64');
  hmac.write(body);
  hmac.end();
  const signature = hmac.read();
  return signature === req.headers['x-hook-signature'];
};

const getCatalogId = async (name) => {
  try {
    const response = await bp._request(
      'https://test-a-prokat1965.bpium.ru/api/v1/catalogs',
      'GET'
    );
    const find = response.data.find((catalog) => catalog.name === name);
    if (find === -1) throw new Error('Document structure is wrong');
    return find.id;
  } catch (e) {
    throw e;
  }
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 200;
    res.end();
  } else if (req.method === 'POST' && req.url === '/api/exchange-rate') {
    getBody(req, async (body) => {
      if (isRequestValid(req, body)) {
        const parsedBody = JSON.parse(body);
        try {
          const response = await axios.get(
            'https://test.bpium.ru/api/webrequest/request'
          );
          await bp.patchRecord(
            parsedBody.payload.catalogId,
            parsedBody.payload.recordId,
            { 3: response.data.value }
          );
          res.writeHead(200, 'Ok', headers);
          res.end();
        } catch (e) {
          console.log(e.message);
        }
      } else {
        res.writeHead(401, 'Unauthorization', headers);
        res.end(JSON.stringify({ error: 'Wrong secret key' }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/api/create-storehous') {
    getBody(req, async (body) => {
      if (isRequestValid(req, body)) {
        try {
          const storehouseId = await getCatalogId('Склад');
          const parsedBody = JSON.parse(body);
          await bp.postRecord(storehouseId, {
            2: parsedBody.timestamp,
            4: parsedBody.payload.values['3'],
          });
          res.writeHead(201, 'Created', headers);
          res.end();
        } catch (e) {
          console.log(e);
        }
      } else {
        res.writeHead(401, 'Unauthorization', headers);
        res.end(JSON.stringify({ error: 'Wrong secret key' }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/api/create-order') {
    getBody(req, async (body) => {
      try {
        const orderId = await getCatalogId('Заказы');
        const parsedBody = JSON.parse(body);
        await bp.postRecord(orderId, {
          3: parsedBody.comment,
        });
        res.writeHead(201, 'Created', headers);
        res.end();
      } catch (e) {
        console.log(e);
      }
    });
  } else {
    res.writeHead(404, 'Unknown endpoint', headers);
    res.end(JSON.stringify({ error: `Unknown endpoint: ${req.url}` }));
  }
});

server.listen(PORT, () =>
  console.log(`Server has been started on ${PORT} port...`)
);
