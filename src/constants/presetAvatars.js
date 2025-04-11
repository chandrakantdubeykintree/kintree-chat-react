export function profileImage(gender) {
  return gender === "m" ? maleAvatars : femaleAvatars;
}
const maleAvatars = [
  {
    id: 1,
    name: "male-1",
    mime: "image/jpeg",
    size: 31455,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/male-1.jpg",
  },
  {
    id: 2,
    name: "male-2",
    mime: "image/jpeg",
    size: 36204,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/male-2.jpg",
  },
  {
    id: 3,
    name: "male-3",
    mime: "image/jpeg",
    size: 30610,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/male-3.jpg",
  },
  {
    id: 4,
    name: "male-4",
    mime: "image/jpeg",
    size: 27738,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/male-4.jpg",
  },
  {
    id: 5,
    name: "male-5",
    mime: "image/jpeg",
    size: 29752,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/male-5.jpg",
  },
];
export const femaleAvatars = [
  {
    id: 6,
    name: "female-1",
    mime: "image/jpeg",
    size: 32177,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/female-1.jpg",
  },
  {
    id: 7,
    name: "female-2",
    mime: "image/jpeg",
    size: 34395,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/female-2.jpg",
  },
  {
    id: 8,
    name: "female-3",
    mime: "image/jpeg",
    size: 39883,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/female-3.jpg",
  },
  {
    id: 9,
    name: "female-4",
    mime: "image/jpeg",
    size: 60525,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/female-4.jpg",
  },
  {
    id: 10,
    name: "female-5",
    mime: "image/jpeg",
    size: 38503,
    url: "https://api.kintree.com/kintree-assets/images/preset-profiles/female-5.jpg",
  },
];
