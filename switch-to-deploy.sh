#!/bin/bash

# Backup original files
cp src/App.jsx src/App.local.jsx
cp src/pages/HomePage.jsx src/pages/HomePage.local.jsx

# Use deployment versions
cp src/App.deploy.jsx src/App.jsx
cp src/pages/HomePage.deploy.jsx src/pages/HomePage.jsx

echo "Switched to deployment version (no authentication)"





