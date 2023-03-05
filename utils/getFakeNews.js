const FAKE_NEWS_DATA = [
  {
    id: 0,
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-1.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 1,
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-2.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 2,
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-3.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 3,
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-4.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 4,
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-5.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 5,
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-6.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 6,
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-7.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 7,
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-news-cover-8.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  }
];

const NEWS_ID_TO_DATA = new Map(FAKE_NEWS_DATA.map((x) => [x.id, x]));

export const getNews = () => {
  return FAKE_NEWS_DATA;
};

export const getNewsById = (id) => {
  return NEWS_ID_TO_DATA.get(Number(id));
};

export const getRelatedNews = (curId) => {
  return [
    getNewsById(
      (Number(curId) - 1 + NEWS_ID_TO_DATA.size) % NEWS_ID_TO_DATA.size
    ),
    getNewsById(
      (Number(curId) + 1 + NEWS_ID_TO_DATA.size) % NEWS_ID_TO_DATA.size
    )
  ];
};
