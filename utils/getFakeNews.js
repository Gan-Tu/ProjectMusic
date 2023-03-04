const FAKE_NEWS_DATA = [
  {
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-1.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-2.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-3.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-4.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-5.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-6.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-7.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-8.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  }
];

export const getNews = () => {
  return FAKE_NEWS_DATA;
};

export const getNewsById = (id) => {
return FAKE_NEWS_DATA[id];
};

export const getNewsTitle = (id) => {
  let titles = [
    "Music News Today",
    "How To Look Like Kanye West",
    "New Project Snapback",
    "WHAT'S TALENT?",
    "Music News Today",
    "How To Look Like Kanye West",
    "New Project Snapback",
    "WHAT'S TALENT?"
  ];
  return titles[id % titles.length];
};