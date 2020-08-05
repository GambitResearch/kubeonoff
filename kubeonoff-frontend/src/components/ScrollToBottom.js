import React from 'react'

class ScrollToBottom extends React.Component {

	componentDidUpdate() {

		const scrollHeight = this.scroller.scrollHeight
		const scrollTop = this.scroller.scrollTop
		const offsetHeight = this.scroller.offsetHeight

		if ( scrollTop + offsetHeight + 30 >= scrollHeight || scrollTop === 0 )
			this.scroller.scrollTop = scrollHeight
	}

	render() {
		return (
			<div
				{...this.props}
				ref={ node => this.scroller = node } />
		)
	}
}

export default ScrollToBottom
