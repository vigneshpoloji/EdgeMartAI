import React from 'react';

export default class DashboardBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.warn('[EdgeMart] Dashboard could not render:',error);}
  render(){
    if(this.state.failed)return <section className="em-catalogue-notice" role="alert"><div><strong>This department could not finish loading.</strong><p>Your account and saved orders are still available. Retry this department or switch using the menu above.</p></div><button onClick={()=>this.setState({failed:false})}>Retry dashboard</button></section>;
    return this.props.children;
  }
}
