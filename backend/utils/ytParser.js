import dotenv from "dotenv";
dotenv.config();

// Get Youtube Id
function getYouTubeId(url) {
  const urlObject = new URL(url);

  if (urlObject.hostname.includes("youtu.be")) {
    return urlObject.pathname.substring(1);
  } else if (urlObject.pathname.includes("embed")) {
    return urlObject.pathname.substring(7);
  } else {
    return urlObject.searchParams.get("v");
  }
}

// Extract transcript from a YT Video
export const extractTranscriptFromYT = async (url) => {
  try {
    const id = getYouTubeId(url);

    if (!id) {
      throw new Error("Invalid YouTube URL");
    }

    const response = await fetch(
      "https://www.youtube-transcript.io/api/transcripts",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.YT_TRANSCRIPT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [id],
        }),
      },
    );

    // ✅ important check
    if (!response.ok) {
      throw new Error("Transcript API failed");
    }

    const data = await response.json();

    if (!data || !data.length) {
      throw new Error("No transcript data");
    }

    const video = data[0];

    let text = "";

    if (video.text) {
      text = video.text;
    } else if (video.tracks && video.tracks[0] && video.tracks[0].transcript) {
      text = video.tracks[0].transcript.map((t) => t.text).join(" ");
    } else {
      throw new Error("Transcript not found");
    }

    return {
      text,
      title: video.title,
      videoId: id,
    };
  } catch (error) {
    console.error("Transcript Extraction Error:", error);

    throw new Error("Failed to extract transcript from YT Video");
  }
};
