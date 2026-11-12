import wave
import struct
import math

def generate_pop(filename="sfx_pop.wav", duration=0.08, sample_rate=44100):
    n_samples = int(sample_rate * duration)
    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(n_samples):
            t = i / sample_rate
            # Frequency pitch drop from 950Hz to 350Hz (clean bubbly pop)
            freq = 950 - 600 * (t / duration)
            env = math.exp(-t * 35.0)  # quick exponential decay
            val = math.sin(2 * math.pi * freq * t) * env
            sample = int(val * 28000)
            sample = max(-32767, min(32767, sample))
            frames.extend(struct.pack('<h', sample))
        wf.writeframes(frames)
    print("Generated", filename)

def generate_whoosh_synth(filename="sfx_whoosh_synth.wav", duration=0.6, sample_rate=44100):
    import random
    n_samples = int(sample_rate * duration)
    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(n_samples):
            t = i / duration
            # bell curve envelope
            env = math.sin(t * math.pi) ** 2
            # filtered noise approximation
            noise = (random.random() * 2 - 1)
            # resonant pitch sweep
            freq = 200 + 1200 * math.sin(t * math.pi)
            val = (noise * 0.4 + math.sin(2 * math.pi * freq * (i / sample_rate)) * 0.6) * env
            sample = int(val * 24000)
            sample = max(-32767, min(32767, sample))
            frames.extend(struct.pack('<h', sample))
        wf.writeframes(frames)
    print("Generated", filename)

generate_pop()
generate_whoosh_synth()
