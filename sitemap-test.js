const test_utils = require("@communicatehealth/browsertests/test-utils.js"),
  driverStub = {
    sleep: function(micros) {
      return new Promise((resolve) => setTimeout(resolve, micros));
    }
  },
  num = process.argv[2] ?? undefined,
  baseUrl = process.argv[3] ?? "",
  path = process.argv[4] ?? "/sitemap.xml";
var currentUrl;

if (!(num + 0) || baseUrl.length === 0) {
  console.log(
    "sitemap-test: tests a number of random pages from sitemap"
  );
  console.log("Syntax: node sitemap-test #tests baseUrl [sitemapPath]");
  console.log('baseUrl example: "https://example.com"');
  console.log('sitemapPath defaults to "/sitemap.xml"');
  process.exit(1);
}

testAndCatch(driverStub, num, baseUrl, path);

async function testAndCatch(driver, num, baseUrl, path) {
  try {
    await test(driverStub, num, baseUrl, path);
  } catch (error) {
    console.log(`Caught error: ${error.message} for ${currentUrl}`);
    if (process.env.SLACK_API_URL) {
      fetch(process.env.SLACK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: 
            `:404error_parrot: Caught error: ${error.message} for ${currentUrl}`
        })
      })
      .catch((newerror) => console.error(newerror));
    }
  }
}

async function test(driver, num, baseUrl, path) {
  var mapEntries = [], testEntries = [];

  currentUrl = baseUrl +  path;
  console.log(`Opening sitemap at ${currentUrl}`);
  
  return await test_utils.readSitemap(null, driver, baseUrl, path)
    .then((_mapEntries) => {
      mapEntries = _mapEntries;
      console.log(`Got ${mapEntries.length} entries in ${path}`);
      if (mapEntries.length === 0) {
        throw new Error(`Sitemap at ${currentUrl} appears to be empty.`);
      }
      if (num > 0) {
        var index = 0;
        let tempEntries = mapEntries
          .sort(() => 0.5 - Math.random())
          .slice(0,num);
        tempEntries.forEach((tempEntry) => {
          tempEntry.type = "random";
          tempEntry.index = index + 1;
          index += 1;
        });
        testEntries.push({"log": "Checking " + num + " random pages"});
        testEntries = testEntries.concat(tempEntries);
      }
    })
    .then(() => {
      var promise = Promise.resolve();
      testEntries.forEach((testEntry) => {
        if (testEntry.log) {
          promise = promise.then(() => console.log(testEntry.log));
        } else {
          promise = promise
            .then(() => driver.sleep(1000))
            .then(() => {
              currentUrl = `${baseUrl}${testEntry.path}`;
              return httpGetStatus(currentUrl);
            })
            .then((status) => {
              if (status >= 400) {
                throw new Error(`Got status code ${status}`);
              }
              console.log(`Got status code ${status}`);
            })
        }
      })
      return promise;
    });
}

async function httpGetStatus(url) {
  console.log(`Trying ${url}`);

  return fetch(url, {signal: AbortSignal.timeout(30000)})
    .then((response) => response.status);
}
