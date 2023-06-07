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

const getProjects = async (page) => {
  const projects = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll(".grid-flow-row a"),
      (element) => ({
        title: element.href.split("/")?.pop(-1),
      })
    );
    return links;
  });

  return projects;
};

const BASE_URL = "https://credits.meowwolf.com";
let json = {};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(BASE_URL, { waitUntil: "load" });

  const exhibitions = await getExhibitions(page);
  json["name"] = "exhibitions";
  json["children"] = [];

  exhibitions.forEach((exhibit) => {
    json["children"].push({ name: exhibit.title, children: [] });
  });

  let anchors = [];
  for (let i = 0; i < exhibitions.length; i++) {
    await page.goto(exhibitions[i].slug, { waitUntil: "load" });
    anchors = await getAnchors(page);

    for (let j = 0; j < anchors.length; j++) {
      json.children?.[i].children.push({
        name: anchors[j].title,
        children: [],
      });
      const url = `${exhibitions[i].slug}/${anchors[j].href}`;
      console.log(url);
      await page.goto(url, { waitUntil: "load" });
      const elements = await page.$$("li button");
      // Get the last selected element
      const lastElement = elements[elements.length - 1];

      // Click on the last selected element
      await lastElement.click();
      const projects = await getProjects(page);
      for (let k = 0; k < projects.length; k++) {
        json.children?.[i].children?.[j].children.push({
          name: projects[k].title,
          size: 100,
        });
      }
      console.log({ projects });
    }
  }

  const jsonData = JSON.stringify(json, null, 2);

  fs.writeFile("data.json", jsonData, (err) => {
    if (err) {
      console.error("Error saving JSON file:", err);
    } else {
      console.log("JSON file saved successfully.");
    }
  });
})();
