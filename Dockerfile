# syntax=docker/dockerfile:1
#
# TactiCore 배포 이미지.
#
# 현재는 백엔드만 담는다. Phase 2에서 프론트엔드 프로젝트가 생기면
# 앞에 node 빌드 스테이지를 추가하고, 산출물(dist/)을 이 스테이지로 복사해
# FastAPI가 정적 서빙하는 멀티스테이지 단일 이미지로 확장한다.
#
# 참고 프로젝트(my-asset-manager)와 달리 소스를 볼륨 마운트하지 않고
# 이미지에 굽는다. 이미지 하나만으로 어디서든 실행되어야 배포에 쓸 수 있다.
# SSH 서버도 넣지 않는다.

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/

# DB는 /app/data 에 생성된다 (config.py의 기본값 = 프로젝트 루트/data).
# compose가 호스트의 ./data 를 여기에 마운트하므로 컨테이너를 지워도 남는다.
VOLUME ["/app/data"]

WORKDIR /app/backend
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
