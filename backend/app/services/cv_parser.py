import pymupdf
from fastapi import HTTPException

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        text_chunks: list[str] = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                text_chunks.append(page_text)
        doc.close()
        full_text = "\n".join(text_chunks).strip()
        if not full_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in the uploaded PDF. Please ensure it is not a scanned image."
            )
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {e}")
