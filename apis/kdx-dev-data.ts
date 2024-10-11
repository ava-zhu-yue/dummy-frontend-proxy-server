import { Express, Request, Response } from 'express';
import puppeteer from 'puppeteer';

const devApiDomain = `https://api.kdx-stms-dev.com/v1`;

type Token = {
  accessToken: string;
  refreshToken: string;
};

const token: Token = {
  accessToken: '',
  refreshToken: '',
};

const loginWithPuppeteer = async () => {
  // eslint-disable-next-line no-console
  console.log('launch puppeteer browser');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.kdx-stms-dev.com/login');

  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'yue.e.zhu@accenture.com'); // your email please

  const [omitInputToggleButton, passkeyToggleButton, loginButton] = await page.$$('button');

  await omitInputToggleButton?.click();
  await passkeyToggleButton?.click();
  await loginButton?.click();

  const tokenResponse = await page.waitForResponse(
    response =>
      response.url().includes('users/publickey/verify') && response.request().method() === 'POST',
  );

  const data: Token = await tokenResponse.json();

  token.accessToken = data.accessToken;
  token.refreshToken = data.refreshToken;

  // eslint-disable-next-line no-console
  console.log('Login and got token: ');
  // eslint-disable-next-line no-console
  console.log(token);

  await page.close();
  await browser.close();
};

const fetchDev = async (url: string) => {
  const response = await fetch(`${devApiDomain}${url}`, {
    headers: {
      accept: '*/*',
      'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
      authorization: `Bearer ${token.accessToken}`,
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      priority: 'u=1, i',
      'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      traceparent: '00-000000000000000051180907dc814726-2a6926f62f138f44-01',
      'x-datadog-origin': 'rum',
      'x-datadog-parent-id': '3056016660941213508',
      'x-datadog-sampling-priority': '1',
      'x-datadog-trace-id': '5843430445882099494',
      Referer: 'https://www.kdx-stms-dev.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    body: null,
    method: 'GET',
  });

  return response;
};

export const useKdxDevData = (app: Express) => {
  app.get('/mockLogin', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('GET', { url: req.url });

    await loginWithPuppeteer();

    res.json({ ...token });
  });

  app.post('/users/login', (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('POST', { url: req.url });

    res.json({
      sessionID: '12345',
      isFIDODefaultLoginMethod: true,
      challenge: '23456',
      allowedCredentials: [
        {
          keyType: 'public-key',
          credentialID: '',
          transports: ['internal', 'hybrid'],
        },
      ],
      userVerification: 'required',
    });
  });

  app.post('/users/publickey/verify', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('POST', { url: req.url });

    await loginWithPuppeteer();

    res.json({ ...token });
  });

  app.post('/users/token/refresh', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('POST', { url: req.url });

    const response = await fetch(`${devApiDomain}/users/token/refresh`, {
      headers: {
        accept: 'application/json',
        'accept-language': 'ja,en-US;q=0.9,en;q=0.8',
        authorization: `Bearer ${token.accessToken}`,
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        pragma: 'no-cache',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        traceparent: '00-0000000000000000261b4da807b6128f-418aa0e857b5b96b-01',
        'x-datadog-origin': 'rum',
        'x-datadog-parent-id': '4722764079015770475',
        'x-datadog-sampling-priority': '1',
        'x-datadog-trace-id': '2745873781891666575',
        Referer: 'https://www.kdx-stms-dev.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      body: `{"refreshToken":"${token.refreshToken}"}`,
      method: 'POST',
    });

    const data: Token = await response.json();

    token.accessToken = data.accessToken;
    token.refreshToken = data.refreshToken;

    // eslint-disable-next-line no-console
    console.log('Refreshed token:');
    // eslint-disable-next-line no-console
    console.log(token);

    res.status(response.status).json(data);
  });

  app.get('/*', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('GET', { url: req.url });

    const response = await fetchDev(req.url);
    const data = await response.json();
    res.status(response.status).json(data);
  });

  app.post('/*', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('POST', { url: req.url });

    const response = await fetch(`${devApiDomain}${req.url}`, {
      "headers": {
        "accept": "application/json",
        "authorization": `Bearer ${token.accessToken}`,
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "traceparent": "00-00000000000000001e77b19deb985562-2d9a24f66aed9280-01",
        "x-datadog-origin": "rum",
        "x-datadog-parent-id": "3285979518894707328",
        "x-datadog-sampling-priority": "1",
        "x-datadog-trace-id": "2195418635187017058",
        "Referer": "https://www.kdx-stms-dev.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": JSON.stringify(req.body),
      "method": "POST"
    });

    res.status(response.status);

    const contentLength = response.headers.get('content-length');
    if (Number.parseInt(contentLength || '0', 10) === 0) {
      res.send();
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      res.json(data);
      return;
    }

    const data = await response.text();
    res.send(data);
  });

  app.put('/*', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('PUT', { url: req.url });

    const response = await fetch(`${devApiDomain}${req.url}`, {
      "headers": {
        "accept": "application/json",
        "authorization": `Bearer ${token.accessToken}`,
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "traceparent": "00-00000000000000001c7655843a26031b-003c481cb7e6268f-01",
        "x-datadog-origin": "rum",
        "x-datadog-parent-id": "16967786784237199",
        "x-datadog-sampling-priority": "1",
        "x-datadog-trace-id": "2050920706713453339",
        "Referer": "https://www.kdx-stms-dev.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": JSON.stringify(req.body),
      "method": "PUT"
    });

    res.status(response.status);

    const contentLength = response.headers.get('content-length');
    if (Number.parseInt(contentLength || '0', 10) === 0) {
      res.send();
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      res.json(data);
      return;
    }

    const data = await response.text();
    res.send(data);
  });

  app.delete('/*', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('DELETE', { url: req.url });

    res.json({})
  });

  app.patch('/*', async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log('PATCH', { url: req.url });

    res.json({})
  });
};
