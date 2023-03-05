const FAKE_BLOG_DATA = [
  {
    id: 0,
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-1.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 1,
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-2.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 2,
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-3.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 3,
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-4.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 4,
    title: "Music News Today",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-5.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 5,
    title: "How To Look Like Kanye West",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-6.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 6,
    title: "New Project Snapback",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-7.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  },
  {
    id: 7,
    title: "WHAT'S TALENT?",
    date: "Aug 27th, 2014",
    author: "Nick Breton",
    imgUrl: "/assets/pm-blog-cover-8.png",
    snippet:
      "The Mens Karrimor Running T shirt is perfect for all runners either during training or races. featuring a lightweigh construction together with perforated under arm panels for a cool feel."
  }
];

const BLOG_ID_TO_DATA = new Map(FAKE_BLOG_DATA.map((x) => [x.id, x]));

export const getBlogs = () => {
  return FAKE_BLOG_DATA;
};

export const getBlogsById = (id) => {
  return BLOG_ID_TO_DATA.get(Number(id));
};

export const getRelatedBlogs = (curId) => {
  return [
    getBlogsById((Number(curId) - 1 + BLOG_ID_TO_DATA.size) % BLOG_ID_TO_DATA.size),
    getBlogsById((Number(curId) + 1 + BLOG_ID_TO_DATA.size) % BLOG_ID_TO_DATA.size)
  ];
};
