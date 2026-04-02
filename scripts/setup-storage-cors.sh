#!/bin/bash
# Run this AFTER initializing Firebase Storage in the Firebase Console
# https://console.firebase.google.com/project/huan-huan-def2c/storage
#
# Usage: bash scripts/setup-storage-cors.sh

BUCKET="huan-huan-def2c.firebasestorage.app"

echo "Setting CORS on gs://$BUCKET ..."
gsutil cors set cors.json "gs://$BUCKET"
echo "Done. Verifying..."
gsutil cors get "gs://$BUCKET"
