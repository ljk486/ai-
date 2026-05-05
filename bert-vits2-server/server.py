"""
ElevenLabs TTS API Server
提供 TTS 和翻译接口
"""

import os
import sys
import json
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

sys.path.insert(0, str(Path(__file__).parent))
from tts_engine import tts_engine

app = Flask(__name__)
CORS(app)

AUDIO_CACHE_DIR = Path(__file__).parent / "audio_cache"
AUDIO_CACHE_DIR.mkdir(exist_ok=True)


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "TTS & Translate Server",
        "version": "2.0.0",
        "status": "running",
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "engine": "elevenlabs"})


@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "缺少 text 参数"}), 400
        text = data["text"]
        output_path = tts_engine.generate_audio_sync(text)
        if output_path and os.path.exists(output_path):
            return send_file(output_path, mimetype="audio/mpeg")
        else:
            return jsonify({"error": "音频生成失败"}), 500
    except Exception as e:
        print(f"TTS 错误: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/translate", methods=["POST"])
def translate():
    """日文 → 中文翻译"""
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "缺少 text 参数"}), 400
        text = data["text"]
        zh = translate_ja_to_zh(text)
        return jsonify({"text": zh})
    except Exception as e:
        print(f"翻译错误: {e}")
        return jsonify({"text": request.get_json().get("text", ""), "error": str(e)})


def translate_ja_to_zh(text):
    """日文翻译成中文"""
    try:
        import requests as req
        # Google Translate 免费接口
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "ja",
            "tl": "zh-CN",
            "dt": "t",
            "q": text,
        }
        r = req.get(url, params=params, timeout=10)
        if r.status_code == 200:
            result = r.json()
            translated = "".join([seg[0] for seg in result[0] if seg[0]])
            return translated
    except Exception as e:
        print(f"Google翻译失败: {e}")

    # 备用：直接返回原文
    return text


if __name__ == "__main__":
    print("TTS & Translate Server")
    print(f"服务地址: http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
