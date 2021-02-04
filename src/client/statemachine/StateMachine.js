let idCount = 0

export default class StateMachine
{
	id = (++idCount).toString()
	context
	states = new Map()

	previousState
	currentState
	isChangingState = false
	changeStateQueue = []

	get previousStateName()
	{
		if (!this.previousState)
		{
			return ''
		}

        return this.previousState.name
	}

	constructor(context, id)
	{
		console.log("State Machine Created")
		this.id = id || this.id
		this.context = context
	}

	isCurrentState(name)
	{
		if (!this.currentState)
		{
			return false
		}

		return this.currentState.name === name
	}

	addState(name, config)
	{
        const context = this.context
        
        const onEnter = config?.onEnter? config.onEnter: () => {};
        const onUpdate = config?.onUpdate? config.onUpdate: () => {};
        const onExit = config?.onExit? config.onExit: () => {};
		
		this.states.set(name, {
			name,
			onEnter: onEnter.bind(context),
			onUpdate: onUpdate.bind(context),
			onExit: onExit.bind(context)
		})

		return this
	}

	setState(name)
	{
		if (!this.states.has(name))
		{
			console.warn(`Tried to change to unknown state: ${name}`)
			return
		}

		if (this.isCurrentState(name))
		{
			return
		}

		if (this.isChangingState)
		{
			this.changeStateQueue.push(name)
			return
		}

		this.isChangingState = true

		console.log(`[StateMachine (${this.id})] change from ${this.currentState?.name ?? 'none'} to ${name}`)

		if (this.currentState && this.currentState.onExit)
		{
			this.currentState.onExit()
		}

		this.previousState = this.currentState
		this.currentState = this.states.get(name)

		if (this.currentState.onEnter)
		{
			this.currentState.onEnter()
		}

		this.isChangingState = false
	}

	update(dt)
	{
		if (this.changeStateQueue.length > 0)
		{
			this.setState(this.changeStateQueue.shift())
			return
		}

		if (this.currentState && this.currentState.onUpdate)
		{
			this.currentState.onUpdate(dt)
		}
	}
}