#!/usr/bin/env bash

set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-taranvohra/bbot}"
BUILDER_NAME="${BUILDER_NAME:-bbot-multiarch}"

case "${1:-}" in
  "")
    PLATFORM="linux/amd64"
    TAG="latest"
    ;;
  arm)
    PLATFORM="linux/arm64"
    TAG="arm"
    ;;
  *)
    echo "Usage: ./build.sh [arm]"
    exit 1
    ;;
esac

if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --name "$BUILDER_NAME" --use
else
  docker buildx use "$BUILDER_NAME"
fi

docker buildx inspect --bootstrap >/dev/null

docker buildx build \
  --platform "$PLATFORM" \
  -f Dockerfile \
  -t "$IMAGE_NAME:$TAG" \
  --push \
  .