import React from 'react'
import './Loading.css'


const Loading = () => (
	<div className='loading'>
		<svg
			width='100%'
			height='100%'
			xmlns='http://www.w3.org/2000/svg'
			viewBox='0 0 100 100'
			preserveAspectRatio='xMidYMid'>
			<circle
				cx='50'
				cy='50'
				fill='none'
				r='46'
				stroke='#28292f'
				strokeWidth='5'>
				<animate
					attributeName='stroke-dasharray'
					calcMode='linear'
					values='0 0 0 144.51326206513048 0 144.51326206513048;0 0 144.51326206513048 0 0 144.51326206513048;0 0 144.51326206513048 0 0 144.51326206513048;0 144.51326206513048 0 144.51326206513048 0 144.51326206513048;0 144.51326206513048 0 144.51326206513048 0 144.51326206513048'
					keyTimes='0;0.2;0.4;0.6;1'
					dur='1.5'
					begin='-1.5s'
					repeatCount='indefinite'></animate>
			</circle>
			<circle
				cx='50'
				cy='50'
				fill='none'
				r='40'
				stroke='#0a0a0a'
				strokeWidth='5'>
				<animate
					attributeName='stroke-dasharray'
					calcMode='linear'
					values='0 0 0 125.66370614359172 0 125.66370614359172;0 0 125.66370614359172 0 0 125.66370614359172;0 0 125.66370614359172 0 0 125.66370614359172;0 125.66370614359172 0 125.66370614359172 0 125.66370614359172;0 125.66370614359172 0 125.66370614359172 0 125.66370614359172'
					keyTimes='0;0.2;0.4;0.6;1'
					dur='1.5'
					begin='-1.38s'
					repeatCount='indefinite'></animate>
			</circle>
			<circle
				cx='50'
				cy='50'
				fill='none'
				r='34'
				stroke='#ffffff'
				strokeWidth='5'>
				<animate
					attributeName='stroke-dasharray'
					calcMode='linear'
					values='0 0 0 106.81415022205297 0 106.81415022205297;0 0 106.81415022205297 0 0 106.81415022205297;0 0 106.81415022205297 0 0 106.81415022205297;0 106.81415022205297 0 106.81415022205297 0 106.81415022205297;0 106.81415022205297 0 106.81415022205297 0 106.81415022205297'
					keyTimes='0;0.2;0.4;0.6;1'
					dur='1.5'
					begin='-1.26s'
					repeatCount='indefinite'></animate>
			</circle>
			<g transform='rotate(180 50 50)'>
				<circle
					cx='50'
					cy='50'
					fill='none'
					r='46'
					stroke='#28292f'
					strokeWidth='5'>
					<animate
						attributeName='stroke-dasharray'
						calcMode='linear'
						values='0 0 0 144.51326206513048 0 144.51326206513048;0 0 144.51326206513048 0 0 144.51326206513048;0 0 144.51326206513048 0 0 144.51326206513048;0 144.51326206513048 0 144.51326206513048 0 144.51326206513048;0 144.51326206513048 0 144.51326206513048 0 144.51326206513048'
						keyTimes='0;0.2;0.4;0.6;1'
						dur='1.5'
						begin='-0.6599999999999999s'
						repeatCount='indefinite'></animate>
				</circle>
				<circle
					cx='50'
					cy='50'
					fill='none'
					r='40'
					stroke='#0a0a0a'
					strokeWidth='5'>
					<animate
						attributeName='stroke-dasharray'
						calcMode='linear'
						values='0 0 0 125.66370614359172 0 125.66370614359172;0 0 125.66370614359172 0 0 125.66370614359172;0 0 125.66370614359172 0 0 125.66370614359172;0 125.66370614359172 0 125.66370614359172 0 125.66370614359172;0 125.66370614359172 0 125.66370614359172 0 125.66370614359172'
						keyTimes='0;0.2;0.4;0.6;1'
						dur='1.5'
						begin='-0.78s'
						repeatCount='indefinite'></animate>
				</circle>
				<circle
					cx='50'
					cy='50'
					fill='none'
					r='34'
					stroke='#ffffff'
					strokeWidth='5'>
					<animate
						attributeName='stroke-dasharray'
						calcMode='linear'
						values='0 0 0 106.81415022205297 0 106.81415022205297;0 0 106.81415022205297 0 0 106.81415022205297;0 0 106.81415022205297 0 0 106.81415022205297;0 106.81415022205297 0 106.81415022205297 0 106.81415022205297;0 106.81415022205297 0 106.81415022205297 0 106.81415022205297'
						keyTimes='0;0.2;0.4;0.6;1'
						dur='1.5'
						begin='-0.96s'
						repeatCount='indefinite'></animate>
				</circle>
			</g>
		</svg>
	</div>
)

export default Loading
