class WhiteboardApp {
  constructor() {
    this.board = document.getElementById('board');
    this.template = document.getElementById('stickyTemplate');
    this.dragData = { offsetX: 0, offsetY: 0, target: null };
    this.boardListenersBound = false;
    this.setupDrawing();
    this.registerActions();
  }

  registerActions() {
    document.getElementById('addSticky').addEventListener('click', () => this.addSticky());
    document.getElementById('addWebsite').addEventListener('click', () => this.addWebsite());
    document.getElementById('addVideo').addEventListener('click', () => this.addVideoPanel());
    document.getElementById('exportDoc').addEventListener('click', () => this.exportDocument());
    document.getElementById('imageUpload').addEventListener('change', (event) => this.addImage(event));
    document.getElementById('analyzeIdeas').addEventListener('click', () => this.analyzeIdeas());
    document.getElementById('sendFeedback').addEventListener('click', () => this.sendFeedback());
  }

  setupDrawing() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const draw = (event) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#5a189a';
      ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    };

    canvas.addEventListener('mousedown', (event) => {
      drawing = true;
      draw(event);
    });
    canvas.addEventListener('mouseup', () => {
      drawing = false;
      ctx.beginPath();
    });
    canvas.addEventListener('mousemove', draw);

    document.getElementById('clearCanvas').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  addSticky() {
    const sticky = this.template.content.firstElementChild.cloneNode(true);
    this.prepareBoardItem(sticky);
    this.board.appendChild(sticky);
  }

  addWebsite() {
    const url = prompt('Website URL to pin:');
    if (!url) return;
    const item = this.createMediaItem('Website');
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.loading = 'lazy';
    item.appendChild(frame);
    this.board.appendChild(item);
  }

  addVideoPanel() {
    const url = prompt('Video URL (mp4 or embeddable):');
    if (!url) return;
    const item = this.createMediaItem('Video');

    if (url.endsWith('.mp4')) {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      item.appendChild(video);
    } else {
      const frame = document.createElement('iframe');
      frame.src = url;
      item.appendChild(frame);
    }

    this.board.appendChild(item);
  }

  addImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const item = this.createMediaItem(file.name);
      const image = document.createElement('img');
      image.src = reader.result;
      image.alt = file.name;
      item.appendChild(image);
      this.board.appendChild(item);
    };
    reader.onerror = () => this.showError('Could not load selected image.');
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  createMediaItem(title) {
    const wrapper = document.createElement('div');
    wrapper.className = 'board-item sticky';
    wrapper.draggable = true;

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    actions.innerHTML = `<strong>${title}</strong><button class="pin" title="Thumb tack">📌</button><button class="remove" title="Remove">✖</button>`;

    wrapper.appendChild(actions);
    this.prepareBoardItem(wrapper);
    return wrapper;
  }

  prepareBoardItem(item) {
    item.style.left = `${Math.floor(Math.random() * 280 + 20)}px`;
    item.style.top = `${Math.floor(Math.random() * 180 + 20)}px`;

    const pin = item.querySelector('.pin');
    const remove = item.querySelector('.remove');

    pin.addEventListener('click', () => {
      item.classList.toggle('pinned');
      item.draggable = !item.classList.contains('pinned');
    });

    remove.addEventListener('click', () => item.remove());

    item.addEventListener('dragstart', (event) => {
      if (item.classList.contains('pinned')) {
        event.preventDefault();
        return;
      }
      const rect = item.getBoundingClientRect();
      this.dragData = {
        target: item,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      event.dataTransfer.setData('text/plain', 'board-item');
    });

    this.bindBoardDragHandlers();
  }

  bindBoardDragHandlers() {
    if (this.boardListenersBound) return;
    this.boardListenersBound = true;

    this.board.addEventListener('dragover', (event) => event.preventDefault());
    this.board.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!this.dragData.target) return;
      const boardRect = this.board.getBoundingClientRect();
      this.dragData.target.style.left = `${event.clientX - boardRect.left - this.dragData.offsetX}px`;
      this.dragData.target.style.top = `${event.clientY - boardRect.top - this.dragData.offsetY}px`;
      this.dragData.target = null;
    });
  }

  exportDocument() {
    const notes = [...this.board.querySelectorAll('textarea')]
      .map((node) => node.value.trim())
      .filter(Boolean)
      .join('\n\n');

    const doc = new Blob([notes || 'Whiteboard notes'], { type: 'application/msword' });
    const url = URL.createObjectURL(doc);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-${Date.now()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async analyzeIdeas() {
    const ideas = document.getElementById('ideas').value.split('\n').map((x) => x.trim()).filter(Boolean);
    const output = document.getElementById('analysisResult');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to analyze ideas.');
      output.textContent = JSON.stringify(payload, null, 2);
    } catch (error) {
      this.showError(error.message);
    }
  }

  async sendFeedback() {
    try {
      const analysis = document.getElementById('analysisResult').textContent.slice(0, 700);
      const rating = document.getElementById('feedbackRating').value;
      const notes = document.getElementById('feedbackNotes').value;

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: analysis, rating, notes }),
      });

      if (!response.ok) {
        throw new Error('Feedback could not be submitted.');
      }

      document.getElementById('feedbackNotes').value = '';
      alert('Feedback sent. Thank you!');
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    alert(`Error: ${message}`);
  }
}

window.WhiteboardApp = WhiteboardApp;
window.addEventListener('DOMContentLoaded', () => new WhiteboardApp());
