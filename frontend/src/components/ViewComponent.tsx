import { useEffect, useState } from "react";

type video = {
    id: string;
    video_name: string;
    video_path: string;
};

export default function ViewComponent() {
    const [videos, setVideos] = useState<Array<video>>([]);

    useEffect(() => {
        fetch("http://localhost:8080/videos", { method: "GET" })
            .then((res) => res.json())
            .then((data) => setVideos(data.data));
    }, []);

    return (
        <div>
            <h1 className="mb-8 text-xl text-center text-white">
                Video from streaming server
            </h1>
            {videos.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 px-8">
                    {videos.map((video) => (
                        <video
                            key={video.id}
                            controls
                            className="w-full mx-auto mb-8 w"
                        >
                            <source
                                src={`http://localhost:8080/stream/${video.id}`}
                                type="video/mp4"
                            />
                            Your browser didnt support video tag
                        </video>
                    ))}
                </div>
            ) : (
                <h1 className="mb-4 text-center text-white">
                    Data masih kosong
                </h1>
            )}
        </div>
    );
}
