// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace OSFramework.OSUI.Patterns.Submenu {
	/**
	 * Defines the interface for OutSystemsUI Patterns
	 */
	export class Submenu extends AbstractPattern<SubmenuConfig> implements ISubmenu {
		private _eventClick: GlobalCallbacks.Generic;
		private _eventKeypress: GlobalCallbacks.Generic;
		private _eventOnMouseEnter: GlobalCallbacks.Generic;
		private _eventOnMouseLeave: GlobalCallbacks.Generic;
		private _globalEventBody: GlobalCallbacks.Generic;
		private _hasActiveLinks = false;
		private _hasElements = false;
		private _isActive = false;
		private _isOpen = false;
		// Platform OnInitialize Callback
		private _platformEventInitializedCallback: GlobalCallbacks.OSGeneric;
		private _platformEventOnToggleCallback: GlobalCallbacks.OSGeneric;
		private _submenuActiveLinksElement: HTMLElement;
		private _submenuAllLinksElement: HTMLAnchorElement[];
		private _submenuHeaderElement: HTMLElement;
		private _submenuLinksElement: HTMLElement;
		public hasClickOutsideToClose = true;

		constructor(uniqueId: string, configs: JSON) {
			super(uniqueId, new SubmenuConfig(configs));
		}

		// Close submenu, when BodyOnCLick event is triggered
		private _bodyClickCallback(_args: string, e: MouseEvent): void {
			if (this.isBuilt && this._isOpen) {
				if (!this.selfElement.contains(e.target as HTMLElement)) {
					this.close();
				}

				e.preventDefault();
				e.stopPropagation();
			}
		}

		private _checkForActiveLinks(): void {
			this._submenuActiveLinksElement =
				Helper.Dom.ClassSelector(this._submenuLinksElement, Enum.CssClass.PatternActive) ||
				Helper.Dom.ClassSelector(this._submenuHeaderElement, Enum.CssClass.PatternActive);

			// Check if submenu contains elements with active class
			this._hasActiveLinks = !!this._submenuActiveLinksElement;
		}

		// Trigger the submenu at toggle behaviour
		private _clickCallback(): void {
			this._toggleSubmenu();
		}

		// Call methods to open or close, based ok e.key and behavior applied
		private _keypressCallback(e: KeyboardEvent): void {
			const _clickedElem: HTMLElement = e.target as HTMLElement;
			const _closestElem: HTMLElement = _clickedElem.closest(Constants.Dot + Enum.CssClass.Pattern);
			const _isEscapedPressed = e.key === GlobalEnum.Keycodes.Escape;
			const _isEnterPressed = e.key === GlobalEnum.Keycodes.Enter;
			const _isTabPressed = e.key === GlobalEnum.Keycodes.Tab;
			const _isShiftPressed = e.shiftKey;

			// Open the submenu
			if (_isEnterPressed) {
				this._toggleSubmenu();
			}
			// Close the submenu when pressing Esc
			if (_isEscapedPressed && this._isOpen) {
				this.close();

				this._submenuHeaderElement.focus();
			}

			// If navigate to outside of Submenu, close it
			if (_isShiftPressed && _isTabPressed && _clickedElem === this._submenuHeaderElement) {
				if (_closestElem === this.selfElement && this._isOpen) {
					this.close();
				}
			}

			e.stopPropagation();
		}

		// Trigger the submenu after an hover behaviour
		private _onMouseEnterCallback(e: MouseEvent) {
			this.open();
			e.stopPropagation();
		}

		// Close the submenu when the cursor leaves the element
		private _onMouseLeaveCallback(e: MouseEvent) {
			// Leave event is triggered each time we moved from the scope;
			// Here we are validating if we hovering any element under _selfElem
			// If we are not hovering it means that we leave the component
			if (this.selfElement.querySelector(':hover') === null) {
				this.close();
			}

			e.preventDefault();
			e.stopPropagation();
		}

		// Remove submenu as active
		private _removeActive(): void {
			if (this._isActive) {
				Helper.Dom.Styles.RemoveClass(this.selfElement, Enum.CssClass.PatternActive);
				this._isActive = false;
			}
		}

		// Method to remove the event listeners
		private _removeEvents(): void {
			// Remove events only if has elements inside and OpenOnHover is not available
			if (this._hasElements) {
				if (this.configs.OpenOnHover === false || Helper.DeviceInfo.IsTouch) {
					this._submenuHeaderElement.removeEventListener(GlobalEnum.HTMLEvent.Click, this._eventClick);
					this._submenuHeaderElement.removeEventListener(GlobalEnum.HTMLEvent.keyDown, this._eventKeypress);
				}

				if (this.configs.OpenOnHover && Helper.DeviceInfo.IsTouch === false) {
					this.selfElement.removeEventListener(GlobalEnum.HTMLEvent.MouseEnter, this._eventOnMouseEnter);
					this.selfElement.removeEventListener(GlobalEnum.HTMLEvent.MouseLeave, this._eventOnMouseLeave);
				}
			}

			// Remove handler from Event Manager
			Event.DOMEvents.Listeners.GlobalListenerManager.Instance.removeHandler(
				Event.DOMEvents.Listeners.Type.BodyOnClick,
				this._globalEventBody
			);
		}

		// Set submenu as active
		private _setActive(): void {
			if (this._isActive === false) {
				Helper.Dom.Styles.AddClass(this.selfElement, Enum.CssClass.PatternActive);
				this._isActive = true;
			}
		}

		// Show submenu
		private _show(): void {
			if (this._isOpen === false) {
				Helper.Dom.Styles.AddClass(this.selfElement, Enum.CssClass.PatternIsOpen);

				this._submenuHeaderElement.focus();
				this._isOpen = true;

				this._updateA11yProperties();
			}
		}

		// Trigger the submenu behavior based on visibility
		private _toggleSubmenu(): void {
			if (this._isOpen) {
				this.close();
			} else {
				// Make async the method call
				Helper.AsyncInvocation(this.open.bind(this));
			}
		}

		// Set the cssClasses that should be assigned to the element on it's initialization
		private _updateA11yProperties(): void {
			Helper.A11Y.AriaExpanded(this._submenuHeaderElement, this._isOpen.toString());
			Helper.A11Y.AriaHidden(this._submenuLinksElement, (!this._isOpen).toString());

			// Update the tabindex of each link
			this._submenuAllLinksElement.forEach((item: HTMLElement) => {
				this._isOpen ? Helper.A11Y.TabIndexTrue(item) : Helper.A11Y.TabIndexFalse(item);
			});
		}

		/**
		 * Add the A11Y attributes values
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected setA11YProperties(): void {
			// Apply the default A11Y
			Helper.A11Y.AriaHasPopupTrue(this._submenuHeaderElement);
			Helper.A11Y.TabIndexTrue(this._submenuHeaderElement);
			Helper.A11Y.AriaControls(this._submenuHeaderElement, this._submenuLinksElement.id);
			Helper.A11Y.RoleButton(this._submenuHeaderElement);

			// Set the role menuitem on each link
			this._submenuAllLinksElement.forEach((item: HTMLElement) => {
				Helper.A11Y.RoleMenuItem(item);
			});

			// Method that as the initial A11Y states and to be used on parameters changed
			this._updateA11yProperties();
		}

		/**
		 * Add Pattern Events
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected setCallbacks(): void {
			// Define the callbacks that will be used
			this._eventClick = this._clickCallback.bind(this);
			this._globalEventBody = this._bodyClickCallback.bind(this);
			this._eventKeypress = this._keypressCallback.bind(this);
			this._eventOnMouseEnter = this._onMouseEnterCallback.bind(this);
			this._eventOnMouseLeave = this._onMouseLeaveCallback.bind(this);

			// Add events only if has elements inside
			if (this._hasElements) {
				// OpenOnHover is only available for devices where the hover exists
				if (this.configs.OpenOnHover === false || Helper.DeviceInfo.IsTouch) {
					this._submenuHeaderElement.addEventListener(GlobalEnum.HTMLEvent.Click, this._eventClick);
				}

				this._submenuHeaderElement.addEventListener(GlobalEnum.HTMLEvent.keyDown, this._eventKeypress);
			}
		}

		/**
		 * Update info based on htmlContent
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected setHtmlElements(): void {
			this._submenuHeaderElement = Helper.Dom.ClassSelector(this.selfElement, Enum.CssClass.PatternHeader);
			this._submenuLinksElement = Helper.Dom.ClassSelector(this.selfElement, Enum.CssClass.PatternLinks);
			this._submenuAllLinksElement = [...this._submenuLinksElement.querySelectorAll(GlobalEnum.HTMLElement.Link)];

			// Check if submenu has childs
			if (this._submenuLinksElement.children.length > 0) {
				this._hasElements = true;
			}

			// Check if submenu contains elements with active class
			Helper.AsyncInvocation(this._checkForActiveLinks.bind(this));
		}

		/**
		 * Set the cssClasses that should be assigned to the element on it's initialization
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected setInitialStates(): void {
			// Add active class to pattern based on links whith active state
			if (this._hasActiveLinks) {
				this._setActive();
			}

			// Add an identifier if the pattern has childs
			if (this._hasElements) {
				Helper.Dom.Styles.AddClass(this.selfElement, Enum.CssClass.PatternIsDropdown);
			} else {
				Helper.Dom.Styles.AddClass(this._submenuLinksElement, Enum.CssClass.PatternIsHidden);
			}

			// In case the class modifier was added by extended class
			if (Helper.Dom.Styles.ContainsClass(this.selfElement, Enum.CssClass.PatternIsOpen) && !this._isOpen) {
				this._isOpen = true;
			}
		}

		/**
		 * Remove all the assigned Events
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected unsetCallbacks(): void {
			this._removeEvents();

			// Reassign the elements to undefined, preventing memory leaks
			this._eventClick = undefined;
			this._eventKeypress = undefined;
			this._globalEventBody = undefined;
			this._eventOnMouseEnter = undefined;
			this._eventOnMouseLeave = undefined;
			this._platformEventInitializedCallback = undefined;
			this._platformEventOnToggleCallback = undefined;
		}

		/**
		 * Reassign the HTML elements to undefined, preventing memory leaks
		 *
		 * @protected
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		protected unsetHtmlElements(): void {
			this._submenuHeaderElement = undefined;
			this._submenuLinksElement = undefined;
			this._submenuAllLinksElement = undefined;
			this._submenuActiveLinksElement = undefined;
		}

		/**
		 * Built the Submenu
		 *
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public build(): void {
			super.build();

			this.setHtmlElements();

			this.setInitialStates();

			this.setA11YProperties();

			this.setCallbacks();

			// Trigger platform's _platformEventInitializedCallback client Action
			Helper.AsyncInvocation(this._platformEventInitializedCallback, this.widgetId);

			this.finishBuild();
		}

		/**
		 * Method to change the value of configs/current state.
		 *
		 * @param {string} propertyName
		 * @param {unknown} propertyValue
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public changeProperty(propertyName: string, propertyValue: unknown): void {
			super.changeProperty(propertyName, propertyValue);
		}

		/**
		 * Method to toggle the behaviour to close submenu when clicking the body
		 *
		 * @param {boolean} clickOutsideToClose
		 * @memberof Submenu
		 */
		public clickOutsideToClose(clickOutsideToClose: boolean): void {
			this.hasClickOutsideToClose = clickOutsideToClose;

			// Make sure the event is updated when the API is triggered in runtime
			if (this.hasClickOutsideToClose) {
				Event.DOMEvents.Listeners.GlobalListenerManager.Instance.addHandler(
					Event.DOMEvents.Listeners.Type.BodyOnClick,
					this._globalEventBody
				);
			} else if (this.hasClickOutsideToClose === false) {
				Event.DOMEvents.Listeners.GlobalListenerManager.Instance.removeHandler(
					Event.DOMEvents.Listeners.Type.BodyOnClick,
					this._globalEventBody
				);
			}
		}

		/**
		 * Close Submenu
		 *
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public close(): void {
			if (this._isOpen) {
				if (this.hasClickOutsideToClose) {
					// Remove handler from Event Manager
					Event.DOMEvents.Listeners.GlobalListenerManager.Instance.removeHandler(
						Event.DOMEvents.Listeners.Type.BodyOnClick,
						this._globalEventBody
					);
				}

				Helper.Dom.Styles.RemoveClass(this.selfElement, Enum.CssClass.PatternIsOpen);

				this._isOpen = false;

				this._updateA11yProperties();

				// Trigger the _platformEventOnToggleCallback callback!
				Helper.AsyncInvocation(this._platformEventOnToggleCallback, this.widgetId, false);
			}
		}

		/**
		 * Destroy the Submenu
		 *
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public dispose(): void {
			// Remove event listners
			this.unsetCallbacks();

			// Remove unused HTML elements
			this.unsetHtmlElements();

			//Destroying the base of pattern
			super.dispose();
		}

		/**
		 * Public Open Submenu
		 *
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public open(): void {
			if (this.hasClickOutsideToClose) {
				// Add the body click handler to event manager
				Event.DOMEvents.Listeners.GlobalListenerManager.Instance.addHandler(
					Event.DOMEvents.Listeners.Type.BodyOnClick,
					this._globalEventBody
				);
			}

			// Make async the method call
			Helper.AsyncInvocation(this._show.bind(this));

			// Trigger the _platformEventOnToggleCallback callback!
			Helper.AsyncInvocation(this._platformEventOnToggleCallback, this.widgetId, true);
		}

		/**
		 * Method used to register the provider callback
		 *
		 * @param {string} eventName
		 * @param {GlobalCallbacks.OSGeneric} callback
		 * @memberof Submenu
		 */
		public registerCallback(callback: GlobalCallbacks.OSGeneric, eventName: string): void {
			switch (eventName) {
				case Enum.Events.Initialized:
					if (this._platformEventInitializedCallback === undefined) {
						this._platformEventInitializedCallback = callback;
					}
					break;

				case Enum.Events.OnToggle:
					if (this._platformEventOnToggleCallback === undefined) {
						this._platformEventOnToggleCallback = callback;
					}
					break;

				default:
					throw new Error(
						`${ErrorCodes.Submenu.FailRegisterCallback}: The given '${eventName}' event name is not defined.`
					);
			}
		}

		/**
		 * Manage Callbacks needed to show submenu on hover
		 *
		 * @memberof Submenu
		 */
		public setOpenOnHover(): void {
			// OpenOnHover is only available for devices where the hover exists
			if (Helper.DeviceInfo.IsTouch === false) {
				if (this._hasElements) {
					this._submenuHeaderElement.removeEventListener(GlobalEnum.HTMLEvent.Click, this._eventClick);
					this._eventClick = undefined;

					Helper.Dom.Styles.AddClass(this.selfElement, Enum.CssClass.PatternIsHover);
					this.selfElement.addEventListener(GlobalEnum.HTMLEvent.MouseEnter, this._eventOnMouseEnter);
					this.selfElement.addEventListener(GlobalEnum.HTMLEvent.MouseLeave, this._eventOnMouseLeave);
				}
			}
		}

		/**
		 * Trigger on submenu onRender, to update active state
		 *
		 * @memberof OSFramework.Patterns.Submenu.Submenu
		 */
		public updateOnRender(): void {
			if (this.isBuilt) {
				// Check if there are active elements inside
				this._checkForActiveLinks();

				if (this._hasActiveLinks && this._isActive === false) {
					this._setActive();
				} else if (this._hasActiveLinks === false && this._isActive) {
					this._removeActive();
				}
			}
		}
	}
}
