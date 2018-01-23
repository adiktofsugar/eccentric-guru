import logging, json, os
from flask import Flask, render_template, request
app = Flask(__name__)

@app.context_processor
def media_paths():
  manifest_path = 'media-manifest.json'
  return dict(media=json.load(open(manifest_path, 'r')))

@app.route('/')
def index():
  return render_template('index.html')


@app.errorhandler(500)
def server_error(e):
  # Log the error and stacktrace.
  logging.exception('An error occurred during a request.')
  return 'An internal error occurred.', 500
