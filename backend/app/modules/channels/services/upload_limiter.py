from fastapi import HTTPException, UploadFile, status


async def read_limited_upload(file: UploadFile, max_bytes: int) -> bytes:
    chunks = []
    total = 0

    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break

        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds allowed size of {max_bytes // (1024 * 1024)} MB.",
            )
        chunks.append(chunk)

    return b"".join(chunks)
