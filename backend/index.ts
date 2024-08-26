import express, { type Request, type Response } from "express";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const port = 8080;

const db = await open({
  filename: "./database/database.db",
  driver: sqlite3.Database,
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mergeChunk = async (fileName: string, totalChunks: number) => {
  const chunkDir = __dirname + "/chunks";
  const mergeFilePath = __dirname + "/storage/video";

  if (!fs.existsSync(mergeFilePath)) {
    fs.mkdirSync(mergeFilePath);
  }

  const writeStream = fs.createWriteStream(`${mergeFilePath}/${fileName}`);
  for (let i = 0; i < totalChunks; i++) {
    const chunkFilePath = `${chunkDir}/${fileName}.part_${i}`;
    const chunkBuffer = await fs.promises.readFile(chunkFilePath);
    writeStream.write(chunkBuffer);
    fs.unlinkSync(chunkFilePath);
  }

  db.run(
    "INSERT INTO videos (id, video_name, video_path) VALUES(?, ?, ?)",
    [
      Date.now() + "",
      fileName,
      path.join(__dirname, "/storage/video/", fileName),
    ],
    (err: any) => {
      if (err) {
        return console.error(err);
      }
    }
  );

  writeStream.end();
  console.log(`Chunk merge succesfully`);
};

app.get("/", (req: Request, res: Response) => {
  res.json({ data: "Hello World" });
});

app.get("/video", (req: Request, res: Response) => {
  const range = req.headers.range;
  const videoPath = "storage/video/2020.mp4";
  const videoSize = fs.statSync(videoPath).size;
  const chunkSize = 1 * 1e6;
  const start = Number(range?.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

app.get("/videos", async (req, res) => {
  const data = await db.all("SELECT * FROM videos");

  if (!data) {
    res.status(200).json({ data: [], msg: "No data retrive" });
  }

  res.status(200).json({ data, msg: "Get all data" });
});

app.get("/stream/:id", async (req: Request, res: Response) => {
  const videoID = req.params.id;
  const video = await db.get("SELECT * FROM videos WHERE id=?", videoID);
  const filePath = video.video_path;
  const fileSize = fs.statSync(filePath).size;
  const range = req.headers.range;

  if (range) {
    const part = range.replace("bytes=", "").split("-");
    const start = parseInt(part[0], 10);
    const end = part[1] ? parseInt(part[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const header = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, header);
    file.pipe(res);
  } else {
    const header = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, header);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const chunk = req.file?.buffer;
  const chunkNumber = Number(req.body.chunkNumber); // Sent from the client
  const totalChunks = Number(req.body.totalChunks); // Sent from the client
  const fileName = req.body.originalname;

  const chunkDir = __dirname + "/chunks"; // Directory to save chunks

  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir);
  }

  const chunkFilePath = `${chunkDir}/${fileName}.part_${chunkNumber}`;

  try {
    await fs.promises.writeFile(chunkFilePath, chunk as Buffer);
    console.log(`Chunk ${chunkNumber}/${totalChunks} saved`);

    if (chunkNumber === totalChunks - 1) {
      // If this is the last chunk, merge all chunks into a single file
      await mergeChunk(fileName, totalChunks);
      console.log("File merged successfully");
    }

    res.status(200).json({ message: "Chunk uploaded successfully" });
  } catch (error) {
    console.error("Error saving chunk:", error);
    res.status(500).json({ error: "Error saving chunk" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
