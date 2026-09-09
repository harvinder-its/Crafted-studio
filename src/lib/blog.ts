// Blog content. The template ships four post cards but only one written
// article (blog-single.html), which every card links to — so each post here
// carries the same demo body. Replace `body` per post with real copy.

export type BlogSection = { heading: string; body: string };

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  day: string;
  month: string;
  date: string;
  image: string;
  intro: string;
  sections: BlogSection[];
  outro: string;
};

const demoIntro =
  "Healthy hair is not just about getting the right haircut. The way you wash, condition, style, and care for your hair every day can make a noticeable difference in how it looks and feels. With a few simple habits and the right routine, you can keep your hair stronger, healthier, and easier to manage. Here are some essential habits to help you take better care of your hair:";

const demoSections: BlogSection[] = [
  {
    heading: "Cleanse Your Hair the Right Way",
    body: "Washing your hair regularly helps remove excess oil, dirt, and product buildup. Choose a shampoo that suits your hair type and avoid washing too often, as excessive cleansing can strip away the natural oils your hair needs to stay healthy.",
  },
  {
    heading: "Keep Your Hair Hydrated",
    body: "Conditioner helps restore moisture after shampooing and can make your hair softer, smoother, and easier to manage. Apply conditioner mainly to the mid-lengths and ends, especially if your hair tends to feel dry or becomes difficult to style.",
  },
  {
    heading: "Do Not Forget Your Scalp",
    body: "A healthy scalp provides a better foundation for healthy-looking hair. Keep your scalp clean and avoid excessive buildup from styling products. Gentle washing and regular care can help maintain a comfortable and balanced scalp.",
  },
  {
    heading: "Protect Your Hair From Heat",
    body: "Frequent exposure to high heat from hair dryers, straighteners, and other styling tools can leave hair dry and damaged. Use lower heat settings when possible and apply suitable protection before using heated styling tools.",
  },
  {
    heading: "Choose the Right Styling Products",
    body: "Not every styling product works for every hair type. Choose products based on your desired finish and the natural texture of your hair. Using the right amount can help you achieve a clean, controlled style without unnecessary buildup.",
  },
];

const demoOutro =
  "Keeping your hair healthy does not require a complicated routine. Consistent cleansing, proper conditioning, scalp care, protection from heat, and smart product choices can all contribute to stronger and better-looking hair. Take care of your hair every day, and your next haircut will always have a better foundation.";

export const posts: BlogPost[] = [
  {
    slug: "keep-your-hair-healthy",
    title: "How to Keep Your Hair Healthy, Strong, and Looking Its Best Every Day",
    category: "Hair Care",
    day: "20",
    month: "Jun",
    date: "20 Jun 2026",
    image: "/images/blog/s1.webp",
    intro: demoIntro,
    sections: demoSections,
    outro: demoOutro,
  },
  {
    slug: "simple-grooming-habits",
    title: "Simple Grooming Habits Every Man Should Add to His Daily Routine",
    category: "Grooming",
    day: "18",
    month: "Jun",
    date: "18 Jun 2026",
    image: "/images/blog/s2.webp",
    intro: demoIntro,
    sections: demoSections,
    outro: demoOutro,
  },
  {
    slug: "right-haircut-for-your-face-shape",
    title: "How to Choose the Right Haircut for Your Face Shape and Personal Style",
    category: "Haircuts",
    day: "15",
    month: "Jun",
    date: "15 Jun 2026",
    image: "/images/blog/s3.webp",
    intro: demoIntro,
    sections: demoSections,
    outro: demoOutro,
  },
  {
    slug: "why-regular-haircuts-matter",
    title: "Why Regular Haircuts Make a Bigger Difference Than You Might Think",
    category: "Barber Tips",
    day: "12",
    month: "Jun",
    date: "12 Jun 2026",
    image: "/images/blog/s4.webp",
    intro: demoIntro,
    sections: demoSections,
    outro: demoOutro,
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function relatedPosts(slug: string) {
  return posts.filter((p) => p.slug !== slug).slice(0, 3);
}

export type Comment = {
  name: string;
  date: string;
  avatar: string;
  body: string;
  replies?: Comment[];
};

export const comments: Comment[] = [
  {
    name: "Michael Carter",
    date: "2 days ago",
    avatar: "/images/testimonial/1.webp",
    body: "I never really paid attention to how often I wash my hair. The tips about choosing the right shampoo and keeping the scalp clean were really helpful.",
    replies: [
      {
        name: "Ryan Mitchell",
        date: "2 days ago",
        avatar: "/images/testimonial/2.webp",
        body: "Same here. I started using conditioner regularly and my hair already feels much easier to manage.",
      },
    ],
  },
  {
    name: "Daniel Brooks",
    date: "2 days ago",
    avatar: "/images/testimonial/3.webp",
    body: "The reminder about heat styling is important. I use a hair dryer almost every day and never thought much about the temperature.",
    replies: [
      {
        name: "Alex Turner",
        date: "2 days ago",
        avatar: "/images/testimonial/4.webp",
        body: "Great article. Finding the right styling product really does make a difference, especially for textured hair.",
      },
    ],
  },
  {
    name: "James Wilson",
    date: "2 days ago",
    avatar: "/images/testimonial/5.webp",
    body: "Simple and practical tips. I especially like the idea of keeping the routine consistent instead of using too many products.",
  },
];

export const commentCount = 5;

export const tags = [
  "Hair Care",
  "Haircuts",
  "Grooming",
  "Styling",
  "Barber Tips",
  "Beard Care",
  "Men's Grooming",
  "Hair Health",
  "Hair Products",
  "Daily Routine",
  "Barbershop",
  "Men's Style",
] as const;
