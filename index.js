const express = require("express");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.send("API WORK !");
});

app.get("/search/:title", async (req, res) => {
  const title = req.params.title;
  const response = await fetch(
    `https://readcomicsonline.ru/search?query=${title}`
  );
  const body = await response.json();

  if (body.suggestions == "") {
    return res.send("Not Found");
  }
  const results = [];

  for (let i = 0; i < body.suggestions.length; i++) {
    const title = body.suggestions[i]["value"];
    const url = `http://localhost:3000/comic/${body.suggestions[i]["data"]}`;
    const data = body.suggestions[i]["data"];
    const result = {
      title,
      url,
      data
    };
    results.push(result);
  }

  res.send(results);
});

app.get("/comic/:title", async (req, res) => {
  const url = `https://readcomicsonline.ru/comic/${req.params.title}`;
  const response = await fetch(url);
  const body = await response.text();
  const $ = cheerio.load(body);

  const title = $(
    ".container > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h2:nth-child(1)"
  )
    .text()
    .trim();
  const image = `https:${$(".img-responsive")
    .attr("src")
    .trim()}`;
  const type = $(".dl-horizontal > dd:nth-child(2)")
    .text()
    .trim();
  const status = $(".dl-horizontal > dd:nth-child(4)")
    .text()
    .trim();
  const otherName = $(".dl-horizontal > dd:nth-child(6)")
    .text()
    .trim();

  const authors = [];

  $(".dl-horizontal > dd:nth-child(8)").each((i, element) => {
    const item = $(element);
    const name = item.find("a").text();
    const author = {
      name
    };
    authors.push(author);
  });

  const dateRelease = $(".dl-horizontal > dd:nth-child(10)").text();

  const categories = [];

  $(".dl-horizontal > dd:nth-child(12)").each((i, element) => {
    const item = $(element);
    const categoryName = item.find("a").text();
    const category = {
      categoryName
    };
    categories.push(category);
  });

  const views = $(".dl-horizontal > dd:nth-child(17)")
    .text()
    .trim();

  const description = $(".manga > p:nth-child(2)")
    .text()
    .trim();

  const chapters = [];

  $(".chapters li").each((i, element) => {
    const item = $(element);
    const title = item
      .find("h5:nth-child(1) > a:nth-child(1)")
      .text()
      .trim();
    const urlRaw = item.find("h5:nth-child(1) > a:nth-child(1)").attr("href");
    const date = item
      .find("div:nth-child(2) > div:nth-child(1)")
      .text()
      .trim();
    const url = `http://localhost:3000/comic/${
      req.params.title
    }/${urlRaw.substr(urlRaw.lastIndexOf("/") + 1)}`;
    const chapter = {
      title,
      urlRaw,
      url,
      date
    };
    chapters.push(chapter);
  });

  const results = {
    title,
    image,
    type,
    status,
    otherName,
    authors,
    dateRelease,
    categories,
    views,
    description,
    chapters
  };

  res.send(results);
});

app.get("/comic/:title/:chapter", async (req, res) => {
  const url = `https://readcomicsonline.ru/comic/${req.params.title}/${
    req.params.chapter
  }`;
  const response = await fetch(url);
  const body = await response.text();
  const $ = cheerio.load(body);
  const pages = [];

  $("#all img").each((i, element) => {
    const item = $(element);

    const image = item.attr("data-src").trim();

    const page = {
      image
    };

    pages.push(page);
  });

  res.send(pages);
});

app.get("/hot", async (req, res) => {
  const url = `https://readcomicsonline.ru/`;
  const response = await fetch(url);

  if (response.status == 500) {
    return res.status(404).send("Chapter Not Found");
  }

  const body = await response.text();
  const $ = cheerio.load(body);
  const comics = [];
  $("#schedule li").each((i, element) => {
    const item = $(element);
    const title = item
      .find(".schedule-name")
      .text()
      .trim();
    const urlRaw = item.find(".schedule-name a").attr("href");
    const comic = {
      title,
      urlRaw,
      url: `${apiEndpoint}/comic/${urlRaw.substr(urlRaw.lastIndexOf("/") + 1)}`
    };
    comics.push(comic);
  });

  res.send(comics);
});

app.listen("4000", () => {
  console.log("Server is running ...");
});
