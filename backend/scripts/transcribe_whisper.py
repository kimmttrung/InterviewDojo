import sys
import json
from faster_whisper import WhisperModel

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing audio file path"}))
        return

    audio_path = sys.argv[1]

    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, info = model.transcribe(audio_path)

    transcript = " ".join([segment.text.strip() for segment in segments]).strip()

    print(json.dumps({
        "language": info.language,
        "transcript": transcript
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()