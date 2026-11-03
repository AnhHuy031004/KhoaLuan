import React from 'react';
export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <main className="startup">
        <h1>Không thể hiển thị trang</h1>
        <p>Vui lòng tải lại để tiếp tục.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          Tải lại trang
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
