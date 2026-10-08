"""
Sarvam AI — one chat completion call.

Run:  python scripts/sarvam_test.py      (from the Traffic/ directory)

The API key is read from the environment and is never printed or logged. If it
is missing the script says so and exits; it deliberately does not fall back to a
placeholder, because a placeholder that appears to work is worse than a clear
failure.

This mirrors scripts/sarvam-test.mjs so the Node app and any Python tooling can
both reach the model.
"""

import os
import pathlib
import sys

from sarvamai import SarvamAI

# Traffic/.env holds SARVAM_API_KEY=...
# No python-dotenv dependency is added for a single key, so the one line that
# matters is parsed here.
ENV_PATH = pathlib.Path(__file__).resolve().parent.parent / ".env"

if not os.environ.get("SARVAM_API_KEY") and ENV_PATH.exists():
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("SARVAM_API_KEY") and "=" in line:
            value = line.split("=", 1)[1].strip().strip("\"'")
            if value:
                os.environ["SARVAM_API_KEY"] = value
            break

api_key = os.environ.get("SARVAM_API_KEY")
if not api_key:
    sys.exit(
        "SARVAM_API_KEY is not set.\n"
        f"Add it to {ENV_PATH} as:  SARVAM_API_KEY=<your key>"
    )

client = SarvamAI(api_subscription_key=api_key)

response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {
            "role": "user",
            "content": "Reply with exactly one short sentence confirming you are connected.",
        },
    ],
)

print(response.choices[0].message.content)