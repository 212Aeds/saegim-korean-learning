# Canceled transcription preparation

A canceled speaking turn could still read and decode its audio before the aborted fetch rejected. Transcription preparation now checks cancellation before reading, after the file read, after decoding, after offline rendering and before constructing the upload. The existing finally block still closes the audio context. Already-running native decoding cannot be interrupted, but its result no longer starts further conversion/upload work after cancellation.

Synthetic tests verify an already-canceled call reads no audio and makes no request, and cancellation during the file read stops before decoding/upload. No user microphone or private data was used. 158 automated tests passed. Production hosted build/typecheck and startup budget passed. No model, provider, voice, account, progress or free usage-cap changes.
