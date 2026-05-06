#!/bin/bash

echo "======================================"
echo "  Widget POC — Starting all services"
echo "======================================"
echo ""

# Start backend
echo "Starting backend on port 4000..."
cd backend && npm start &
BACKEND_PID=$!

# Start widget app
echo "Starting widget app on port 3001..."
cd widget-app && PORT=3001 npm start &
WIDGET_PID=$!

# Start host app
echo "Starting host app on port 3000..."
cd host-app && PORT=3000 npm start &
HOST_PID=$!

echo ""
echo "All services starting..."
echo "  Host app:   http://localhost:3000"
echo "  Widget app: http://localhost:3001"
echo "  Backend:    http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $WIDGET_PID $HOST_PID 2>/dev/null; exit" INT TERM
wait
