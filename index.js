const puppeteer = require("puppeteer");
const fs = require("fs");

const getExhibitions = async (page) => {
  const exhibitions = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll(".venue-section"),
      (element) => {
        const obj = {
          slug: element.href,
          title: element?.href?.split("/")?.pop(-1),
        };
        return obj;
      }
    );
    return links;
  });
  return exhibitions;
};

const getAnchors = async (page) => {
  const anchors = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll(".swiper-slide > div"),
      (element) => ({
        title: element.title,
        href: element.title.toLowerCase().replace(/ /g, "-"),
      })
    );
    return links;
  });

  return anchors;
};

(async () => {
  let json = {};

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://credits.meowwolf.com", { waitUntil: "load" });

  const exhibitions = await getExhibitions(page);
  json["name"] = "exhibitions";
  json["children"] = []

  exhibitions.forEach((exhibit) => {
    json["children"].push({ name: exhibit.title, children: [] });
  });
  for (let i = 0; i < exhibitions.length; i++) {
    await page.goto(exhibitions[i].slug);
    const anchors = await getAnchors(page);
    anchors.forEach(anchor => {
      json.children?.[i].children.push({name: anchor.title, children: []})
    })
  }
  console.log(JSON.stringify(json, null, 2));
const jsonData = JSON.stringify(json, null, 2);

  fs.writeFile("data.json", jsonData, (err) => {
    if (err) {
      console.error("Error saving JSON file:", err);
    } else {
      console.log("JSON file saved successfully.");
    }
  });
})();
