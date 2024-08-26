import { ChangeEvent, useState } from "react";

function formatBytes(bytes: number | string, decimals = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function UploadComponent() {
  const [progress, setProgress] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const { files } = ev.target;
    const selectedFiles = files as FileList;
    setFile(selectedFiles?.[0]);
  };

  const handleFileUpload = () => {
    if (!file) {
      alert("File kosong, pilih file yang ingin di upload");
      return;
    }

    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunkProgress = 100 / totalChunks;
    let chunkNumber = 0;
    let start = 0;
    let end = 0;

    const uploadNextChunk = async () => {
      if (end <= file.size) {
        const chunk = file.slice(start, end);
        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkNumber", chunkNumber);
        formData.append("totalChunks", totalChunks);
        formData.append("originalname", file.name);

        fetch("http://localhost:8080/upload", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            setProgress(Math.floor(Number((chunkNumber + 1) * chunkProgress)));
            chunkNumber++;
            start = end;
            end = start + chunkSize;
            uploadNextChunk();
          })
          .catch((err) => console.error("Error upload chunk: ", err));
      } else {
        setProgress(100);
        setFile(null);
      }
    };

    uploadNextChunk();
  };

  return (
    <div>
      <h1 className="mb-8 text-xl text-center text-white">Upload Component</h1>
      <div className="flex items-center justify-center gap-4 mb-2 text-center">
        <input
          type="file"
          className="p-2 text-white rounded-md cursor-pointer bg-slate-600"
          onChange={(ev) => handleFileChange(ev)}
        />
        <button
          className="self-stretch px-4 text-white transition-all duration-150 rounded-md bg-slate-600 hover:bg-slate-700"
          onClick={handleFileUpload}
        >
          Upload
        </button>
      </div>
      {file && (
        <div className="flex justify-center gap-2 mb-8 text-white">
          <p>{file.name}</p> | <p>{formatBytes(file.size)}</p>
        </div>
      )}
      <div className="w-full max-w-3xl p-1 mx-auto mb-2 rounded-full bg-slate-700">
        <div
          className="h-2 transition-all duration-300 rounded-full bg-slate-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      ;<p className="mb-8 text-xl text-center text-white">{progress}%</p>
    </div>
  );
}
