const express = require('express');
const { cloudinary } = require('./config/config');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const DATA_FILE = path.join(__dirname, 'imageData.json');

function saveImageData(imageData) {
  fs.readFile(DATA_FILE, (err, data) => {
      if (err) {
          console.log("Error reading file:", err);
          if (err.code === 'ENOENT') {
              // If the file does not exist, create it with the first image
              fs.writeFile(DATA_FILE, JSON.stringify([imageData], null, 2), err => {
                  if (err) {
                      console.log("Error writing new file:", err);
                  } else {
                      console.log("Successfully created and saved imageData.json with initial data");
                  }
              });
          }
      } else {
          try {
              const images = JSON.parse(data);
              images.push(imageData);
              fs.writeFile(DATA_FILE, JSON.stringify(images, null, 2), err => {
                  if (err) {
                      console.log("Error writing to file:", err);
                  } else {
                      console.log("Successfully updated imageData.json");
                  }
              });
          } catch (parseErr) {
              console.log("Error parsing JSON data:", parseErr);
          }
      }
  });
}


app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream({ resource_type: 'auto' }, 
      (error, result) => {
        if (error) return res.status(500).send("Upload Failed");
        // Save image data
        saveImageData({ url: result.url, public_id: result.public_id });
        return res.status(200).json(result);
      }
    ).end(req.file.buffer);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.get('/images', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
      if (err) {
          console.log("Error reading file:", err);
          if (err.code === 'ENOENT') {
              res.status(404).json({ message: "No image data found. File not present." });
          } else {
              res.status(500).json({ message: "Failed to read image data" });
          }
      } else {
          try {
              const images = JSON.parse(data);
              images.reverse(); 
              res.status(200).json(images);
          } catch (parseErr) {
              console.log("Error parsing JSON data:", parseErr);
              res.status(500).json({ message: "Error parsing image data" });
          }
      }
  });
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});