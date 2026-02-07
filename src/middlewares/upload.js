import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
destination: function (req, file, cb) {
  cb(null, path.join("src", "public", "uploads", "products"));
},
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp|jfif/;
  const ext = allowedExt.test(path.extname(file.originalname).toLowerCase());

  const allowedMime = file.mimetype.startsWith("image/");

  if (ext && allowedMime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};


export const upload = multer({ storage, fileFilter });
