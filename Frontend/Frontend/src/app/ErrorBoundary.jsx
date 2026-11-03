import React from "react";
export default class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  render() {
    return this.state.error ? <div className="startup">
        <h1>Không thể hiển thị trang</h1>
        <p>Vui lòng tải lại trang để tiếp tục.</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </div> : this.props.children;
  }
}
