import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

// Test user data
const testData = {
    roomId: '8c33324e-919b-4f30-8a50-8e12b3e8c849', // Replace with actual room ID
    userId: '89904ef4-ca01-46e1-8b5b-9b0ff70b58e6'  // Replace with actual user ID
};

// Connect to socket
socket.on('connect', () => {
    console.log('Connected to server');
    console.log('Joining room:', testData.roomId);
    socket.emit('join_room', { roomId: testData.roomId });
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Listen for quiz events
socket.on('quizStarted', (data) => {
    console.log('Quiz started:', data);
});

socket.on('new_question', (data) => {
    console.log('New question received:', data);
    console.log('Question time limit:', data.timeLimit, 'seconds');

    // Simulate answering after 2 seconds
    setTimeout(() => {
        console.log('Sending answer...');
        socket.emit('submitAnswer', {
            roomId: testData.roomId,
            userId: testData.userId,
            answer: 1 // Test with first option
        });
        console.log('Answer sent');
    }, 2000);
});

socket.on('answer_result', (data) => {
    console.log('Answer result:', data);
});

socket.on('quiz_ended', (data) => {
    console.log('Quiz ended:', data);
});

socket.on('time_update', (data) => {
    console.log('Time remaining:', data.timeRemaining, 'seconds');
});

socket.on('leaderboard_update', (data) => {
    console.log('Current Leaderboard:');
    data.scores.forEach((score: any, index: number) => {
        console.log(`${index + 1}. ${score.username}: ${score.score} points (${score.correctCount}/${score.answeredCount})`);
    });
});