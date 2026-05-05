"""
ElevenLabs TTS Engine
使用 ElevenLabs 在线 TTS 服务生成语音
"""

import os
import time
import requests
from pathlib import Path


class TTSEngine:
    def __init__(self):
        self.api_key = os.environ.get("ELEVENLABS_API_KEY", "")
        if not self.api_key:
            # 从 .env 文件读取
            env_file = Path(__file__).parent / ".env"
            if env_file.exists():
                for line in env_file.read_text().splitlines():
                    if line.startswith("ELEVENLABS_API_KEY="):
                        self.api_key = line.split("=", 1)[1].strip()
        self.voice_id = "fUjY9K2nAIwlALOwSiwc"  # Yui - Warm, Clear and Natural
        self.model_id = "eleven_multilingual_v2"
        self.speed = 0.92
        self.stability = 0.6
        self.similarity_boost = 0.75
        self.api_url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

    def generate_audio_sync(self, text, output_path=None):
        if not self.api_key:
            print("错误: 未设置 ELEVENLABS_API_KEY 环境变量")
            return None

        if not output_path:
            temp_dir = Path(__file__).parent / "audio_cache"
            temp_dir.mkdir(exist_ok=True)
            output_path = str(temp_dir / f"tts_{int(time.time()*1000) % 1000000}.mp3")

        try:
            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            }
            payload = {
                "text": text,
                "model_id": self.model_id,
                "voice_settings": {
                    "stability": self.stability,
                    "similarity_boost": self.similarity_boost,
                    "speed": self.speed,
                },
            }
            r = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            if r.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(r.content)
                print(f"ElevenLabs 生成成功: {output_path}")
                return output_path
            else:
                print(f"ElevenLabs API 错误: {r.status_code} {r.text[:200]}")
                return None
        except Exception as e:
            print(f"ElevenLabs 生成失败: {e}")
            return None


tts_engine = TTSEngine()
