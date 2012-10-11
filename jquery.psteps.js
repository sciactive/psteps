/*
 * jQuery Pines Steps (psteps) Plugin 0.0.1alpha
 *
 * http://pinesframework.org/psteps/
 * Copyright (c) 2012 Angela Murrell
 *
 * Triple license under the GPL, LGPL, and MPL:
 *	  http://www.gnu.org/licenses/gpl.html
 *	  http://www.gnu.org/licenses/lgpl.html
 *	  http://www.mozilla.org/MPL/MPL-1.1.html
 */

(function($) {
	$.fn.psteps = function(options) {
		// Build main options before element iteration.
		var opts = $.extend({}, $.fn.psteps.defaults, options);

		// Iterate and transform each matched element.
		var all_elements = this;
		all_elements.each(function(){
			var psteps = $(this);
			psteps.psteps_version = "0.0.1alpha";

			// Check for the psteps class. If it has it, we've already transformed this element.
			if (psteps.hasClass("steps-transformed")) return true;
			// Add the psteps class.
			psteps.addClass("steps-transformed");

			psteps.opts = opts;

			// All arrays and objects in our options need to be copied,
			// since they just have a pointer to the defaults if we don't.
			//psteps.example_property = psteps.example_property.slice();

			// Step submit and next button variables
			var all_steps = psteps.find('.step-content'),
				all_titles = psteps.find('.step-title'),
				step_names = psteps.find('.step-name'),
				next_button = psteps.find('.next-button'),
				back_button = psteps.find('.back-button'),
				send_button = psteps.find('.submit-button'),
				toggle_buttons = psteps.find('.next-button, .submit-button'),
				num_steps = psteps.find('.step-title').length,
				first_time = true;


			psteps.get_max_height = function(elements){
				var max = -1;
				elements.each(function(){
					var h = $(this).height();
					max = h > max ? h : max;
				});
				return max;
			}

			if (!opts.step_order)
				psteps.find('.step-order').hide();

			// Function that takes step names from titles and makes a heading in
			// the step content.
			psteps.make_step_content_headings = function() {
				psteps.find('.step-title').each(function(r){
					var step_name = $(this).find('.step-name'),
						step_content = psteps.find('.step-content').eq(r);
					if (step_name.length == 1) {
						if (opts.content_headings_hr)
							var the_hr = '<hr/>';
						else
							the_hr = '';
						var the_heading = '<div class="step-content-name"><'+opts.content_headings_element+'>'+step_name.html()+'</'+opts.content_headings_element+'>'+the_hr+'</div>'
						if (opts.content_headings_after != false && step_content.find(opts.content_headings_after).length > 0)
							step_content.find(opts.content_headings_after).after(the_heading)
						else
							step_content.prepend(the_heading);
					}
				});
			};

			// Window Resize
			if (opts.content_height_equalize || opts.steps_height_equalize || opts.steps_width_percentage || opts.shrink_step_names) {
				// Get original max height for equalizing title heights.
				if (opts.steps_height_equalize) {
					var titles = psteps.find('.step-title'),
						original_height = psteps.get_max_height(titles);
				}
				if (opts.content_height_equalize) {
					// going to use a time out here too, so the height is fully determined.
					var step_content = psteps.find('.step-content');
					step_content.addClass('clearfix');
					var original_content_height = psteps.get_max_height(step_content);
				}
				$(window).resize(function(){
					// Ensure horizontal step widths always look good (responsive/mobile)
					if (opts.steps_width_percentage) {
						var percentage = (100 / num_steps) - 1;
						if ($(window).width() < parseInt(opts.alter_width_at_viewport))
							psteps.find('.step-title').css({
								'width': percentage+'%',
								'padding-left': '0',
								'padding-right': '0'
							});
					}

					// When viewport is small, do not display step names. Show numbers only.
					if (opts.shrink_step_names) {
						// Time outs needed so that the following can remove content names.
						if ($(window).width() <= parseInt(opts.alter_names_at_viewport)) {
							setTimeout(function(){
								psteps.find('.step-content-name').remove();
								psteps.find('.step-name').hide();
								psteps.find('.step-order').show();
								psteps.make_step_content_headings();
							}, 200);
						} else {
							setTimeout(function(){
								psteps.find('.step-content-name').remove();
								if (!opts.step_order)
									psteps.find('.step-order').hide();
								if (opts.step_names)
									psteps.find('.step-name').show();
								if (opts.content_headings)
									psteps.make_step_content_headings();
							}, 200);
						}
					}

					// Equalize title heights
					if (opts.steps_height_equalize) {
						var titles = psteps.find('.step-title');
						titles.css('min-height', original_height);
						titles.css('min-height', psteps.get_max_height(titles));
					}

					// Equalize content heights
					if (opts.content_height_equalize) {
						setTimeout(function(){
							var step_content = psteps.find('.step-content');
							step_content.css('min-height', original_content_height);
							step_content.css('min-height', psteps.get_max_height(step_content));
						}, 2000);
					}
				}).resize();
			}

			// Function for adjusting progress title bars on textarea change.
			// All Validation happens here.
			psteps.check_progress_titles = function(){
				psteps.find('.step-content').each(function(i){
					var cur_step = $(this),
						class_to_add = 'pstep'+(i+1);
					cur_step.addClass(class_to_add);
					// this title matches the content
					var title = psteps.find('.step-title').eq(i);
					// Titles are always colored to indicate progress for present/past steps
					// If you can click titles, colored progress will indicate for future steps too.
					if ((opts.traverse_titles == 'visited' && title.hasClass('step-visited')) || (opts.traverse_titles == 'never' && title.hasClass('step-visited')) || opts.traverse_titles == 'always') {
						var validate_result = opts.validation_rule.call(cur_step);
						if (validate_result == 'warning') {
							title.removeClass('step-error btn-info btn-success btn-warning btn-danger').addClass('step-warning');
							psteps.trigger_error(cur_step);
						} else if (validate_result == 'error') {
							title.removeClass('step-warning btn-info btn-success btn-warning btn-danger').addClass('step-error');
							psteps.trigger_error(cur_step);
						} else if (validate_result) {
							title.removeClass('step-warning btn-info btn-warning btn-danger step-error').addClass('btn-success')
							if (opts.check_marks)
								title.find('i.step-mark').remove().end().prepend('<i class="icon-ok step-mark"></i> ');
						} else if (!validate_result) {
							title.removeClass('step-warning btn-info btn-success btn-danger btn-warning step-error')
								.addClass('btn-info')
								.find('i.step-mark').remove();
						}
					}
				});
				psteps.toggle_buttons_function();
				psteps.trigger('validation_complete');
			}

			// Function for toggling send/next buttons as btn-success or btn-info.
			psteps.toggle_buttons_function = function(){
				// Toggle whether to show send or next.
				if (psteps.find('.step-content').last().hasClass('step-active')) {
					next_button.hide();
					send_button.show();
				} else {
					next_button.show();
					send_button.hide();
				}

				// Changes color of send/next buttons based upon completion.
				var active_title = psteps.find('.step-title.step-active');
				if (active_title.hasClass('btn-success') || active_title.hasClass('step-warning'))
					toggle_buttons.removeClass('btn-info').addClass('btn-success');
				else if (active_title.hasClass('btn-info'))
					toggle_buttons.removeClass('btn-success').addClass('btn-info');
				else if (active_title.hasClass('step-error'))
					toggle_buttons.removeClass('btn-success btn-info').addClass('btn-danger');

				// Check submit button for all steps if necessary
				if (opts.validate_submit_all_steps) {
					if (all_titles.filter('.btn-info').length || (all_titles.filter('.step-error').length && !opts.ignore_errors_on_submit))
						send_button.removeClass('btn-success').addClass('btn-info');
				}

				// Back Button
				if (opts.back) {
					if (psteps.find('.step-title').first().hasClass('step-active'))
						back_button.hide();
					else {
						var previous_title = psteps.find('.step-title.step-active').prevAll('.step-title:first');
						if (previous_title.hasClass('btn-info'))
							back_button.removeClass('btn-success btn-warning btn-danger').addClass('btn-info').css('cursor', 'pointer');
						else if (previous_title.hasClass('btn-success'))
							back_button.removeClass('btn-info btn-warning btn-danger').addClass('btn-success').css('cursor', 'pointer');
						else if (previous_title.hasClass('btn-warning'))
							back_button.removeClass('btn-info btn-success btn-danger').addClass('btn-warning').css('cursor', 'pointer');
						else if (previous_title.hasClass('btn-danger'))
							back_button.removeClass('btn-success btn-warning btn-info').addClass('btn-danger').css('cursor', 'pointer');

						back_button.show();
					}
				} else
					back_button.hide();
			}

			// Function to go to a certain step
			psteps.go_to_step = function(step_num){
				var c = 1,
					last_active_title = psteps.find('.step-title.last-active'),
					last_active_content = psteps.find('.step-content.last-active'),
					active_step = psteps.find('.step-content.step-active'),
					active_title = psteps.find('.step-title.step-active'),
					show_step,
					show_title;

				if (step_num > num_steps)
					return;

				psteps.find('.step-content').each(function(){
					if (c == step_num)
						show_step = $(this);
					c++;
				});
				c = 1;
				psteps.find('.step-title').each(function(){
					if (c == step_num)
						show_title = $(this);
					c++;
				});

				if (!show_step.hasClass('step-loaded'))
					opts.steps_onload.call(show_step);

				opts.steps_hide.call(active_step);

				last_active_title.removeClass('last-active');
				last_active_content.removeClass('last-active');

				active_step.hide().removeClass('step-active').addClass('last-active');
				show_step.show().addClass('step-active step-visited step-loaded');

				opts.steps_show.call(show_step);

				active_title.removeClass('step-active').addClass('disabled last-active');
				show_title.addClass('step-active step-visited').removeClass('disabled');

				// If visisted traversing,
				if (opts.traverse_titles == 'visited')
					active_title.css('cursor', 'pointer');

				if (first_time)
					first_time = false;
				else
					psteps.trigger('validate_psteps');
				psteps.toggle_buttons_function();
			}

			// Function to go to the next step (calls go to step)
			psteps.next_step_function = function(){
				var preceeding_titles = psteps.find('.step-title.step-active').prevAll('.step-title'),
					num = preceeding_titles.length + 2;
				psteps.go_to_step(num);
			}

			// Function to go to the next step (calls go to step)
			psteps.previous_step_function = function(){
				var preceeding_titles = psteps.find('.step-title.step-active').prevAll('.step-title'),
					num = preceeding_titles.length;
				psteps.go_to_step(num);
			}

			// Function for traversing steps through the titles.
			psteps.traverse_titles_function = function(){
				psteps.change_traverse(opts.traverse_titles);
			}

			// Function to set or change the way titles are traversed. Used by the traver_titles_function
			// and the binding events that can be triggered to change the type.
			psteps.change_traverse = function(type) {
				if (type == 'always'){
					var step_titles = psteps.find('.step-title');
					step_titles.unbind('click')
					step_titles.click(function(){
						var clicked_title = $(this),
							all_prev = clicked_title.prevAll('.step-title'),
							click_num = all_prev.length + 1;
						psteps.go_to_step(click_num);
					}).css('cursor', 'pointer');
				} else if (type == 'visited') {
					var titles_visited = psteps.find('.step-title.step-visited');
					titles_visited.css('cursor', 'pointer');
					psteps.off('click', '.step-title.step-visited');
					psteps.on('click', '.step-title.step-visited', function(){
						var clicked_title = $(this);
						// if the title is the "next" title from the current view,
						// trigger next.
						// if the title is the "previous" title from the current view,
						// trigger previous.
						if (clicked_title.prevAll('.step-title:first').hasClass('step-active'))
							psteps.next_step_function();
						else if (clicked_title.nextAll('.step-title:first').hasClass('step-active'))
							psteps.previous_step_function();
						else {
							var all_prev = clicked_title.prevAll('.step-title'),
								click_num = all_prev.length + 1;
							psteps.go_to_step(click_num);
						}
					});
				} else if (type == 'never') {
					step_titles = psteps.find('.step-title');
					step_titles.css('cursor', 'default');
					// this is for never, which this is actually super useful.
					// It allows the user to click on the current step, which
					// may trigger the alert for why a step is showing a warning
					// or an error. Because the "next" button on errors will
					// trigger a click on this step (which shows the error message)
					// from the validation rule. This allows for unique error
					// messages to show on the next button.
					psteps.off('click', '.step-title.step-active')
					psteps.on('click', '.step-title.step-active', function(){
						var clicked_title = $(this),
							all_prev = clicked_title.prevAll('.step-title'),
							click_num = all_prev.length + 1;
						psteps.go_to_step(click_num);
					});
				}
			}


			// Trigger Error in Title
			psteps.trigger_error = function(the_step) {
				var step_num = the_step.prevAll('.step-content').length + 1,
					title,
					c = 1;
				psteps.find('.step-title').each(function(){
					if (c == step_num)
						title = $(this);
					c++;
				});
				if (title.hasClass('step-warning')) {
					title.removeClass('btn-info btn-success').addClass('btn-warning')
					if (opts.check_marks)
						title.find('i.step-mark').remove().end().prepend('<i class="icon-remove step-mark"></i> ');
				} else if (title.hasClass('step-error')) {
					title.removeClass('btn-info btn-success').addClass('btn-danger')
					if (opts.check_marks)
						title.find('i.step-mark').remove().end().prepend('<i class="icon-remove step-mark"></i> ');
				}
			}

			// Load necessary classes
			all_steps.hide().first().addClass('step-visited step-active').show();
			all_titles.addClass('disabled btn').first().addClass('step-visited step-active').removeClass('disabled');
			if (!opts.step_names)
				step_names.hide();
			// Load functions
			psteps.traverse_titles_function();
			psteps.check_progress_titles();
			if (opts.content_headings)
				psteps.make_step_content_headings();

			// Load the default step
			if (opts.start_incomplete_step) {
				var incomplete = psteps.find('.step-title.btn-info').first(),
					all_prev = incomplete.prevAll('.step-title'),
					num = all_prev.length + 1;
				psteps.go_to_step(num);
			} else if (opts.start_warning_step) {
				var warning = psteps.find('.step-title.step-warning').first();
				all_prev = warning.prevAll('.step-title');
				num = all_prev.length + 1;
				psteps.go_to_step(num);
			} else if (opts.start_error_step) {
				var error = psteps.find('.step-title.step-error').first();
				all_prev = error.prevAll('.step-title');
				num = all_prev.length + 1;
				psteps.go_to_step(num);
			} else
				psteps.go_to_step(opts.step_start);


			// Event Triggers
			back_button.click(function(){
				psteps.previous_step_function();
			});

			// Extremely useful for instant validation, for example, after a
			// user has completed an input on a step.
			var last_val_timestamp = 0;
			psteps.bind('validate_psteps', function(e){
				console.log(e);
				// Validation throttling: validation events called within 500ms
				// should be considered the same event.
				if (e.timeStamp < (last_val_timestamp + 500)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
				last_val_timestamp = e.timeStamp;
				psteps.check_progress_titles();
			});

			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_never', function(){
				psteps.change_traverse('never');
			});

			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_always', function(){
				psteps.change_traverse('always');
			});

			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_visited', function(){
				psteps.change_traverse('visited');
			});

			// Loads the call back for what happens after steps, probably
			// when a submit button is pressed.
			psteps.bind('load_after_steps', function(){
				opts.load_after_steps.call(psteps);
			});

			// Have yet to find a use for this, but maybe it will be to someone.
			all_steps.bind('psteps_step_error', function(){
				psteps.trigger_error($(this));
			});

			// When triggered on a step, it will go there, despite traversal settings.
			all_titles.bind('go_to_step', function(){
				var cur_step = $(this),
					preceeding_titles = cur_step.prevAll('.step-title'),
					num = preceeding_titles.length + 1;
				psteps.go_to_step(num);
			});

			// When triggered on psteps object, it goes to the first incomplete step.
			psteps.bind('go_to_first_incomplete', function(){
				var cur_step = psteps.find('.step-title.btn-info:first'),
					preceeding_titles = cur_step.prevAll('.step-title'),
					num = preceeding_titles.length + 1;
				psteps.go_to_step(num);
			});

			// When triggered on psteps object, it goes to the first step with an error.
			psteps.bind('go_to_first_warning', function(){
				var cur_step = psteps.find('.step-title.step-warning:first'),
					preceeding_titles = cur_step.prevAll('.step-title'),
					num = preceeding_titles.length + 1;
				psteps.go_to_step(num);
			});

			// When triggered on psteps object, it goes to the first step with an error.
			psteps.bind('go_to_first_error', function(){
				var cur_step = psteps.find('.step-title.step-error:first'),
					preceeding_titles = cur_step.prevAll('.step-title'),
					num = preceeding_titles.length + 1;
				psteps.go_to_step(num);
			});

			// Submit or Next. Checks for success in order to progress. Stops submit if fails.
			toggle_buttons.click(function(e){
				var this_button = $(this);
				// Just to make sure that the validation ran and titles are correct run check titles.
				psteps.trigger('validate_psteps');
				var active_title = psteps.find('.step-title.step-active');
				if (active_title.hasClass('step-error') && opts.validate_errors && !opts.validate_next_step) {
					if (opts.validate_use_error_msg)
						alert(opts.validate_error_msg)
					else
						active_title.click();
				} else if (active_title.hasClass('step-error') && opts.validate_next_step && !opts.ignore_errors_on_next) {
					//do nothing.
				} else if (active_title.hasClass('step-error') && opts.ignore_errors_on_next)
					psteps.next_step_function();
				else if (this_button.hasClass('btn-success'))
					psteps.next_step_function();
				else if (this_button.hasClass('submit-button') && (opts.validate_submit_all_steps || opts.validate_next_step)) {
					if (opts.use_before_submit)
						alert(opts.before_submit);
					e.preventDefault();
				} else if (opts.validate_next_step && opts.use_before_next)
						alert(opts.before_next);
				else
					psteps.next_step_function();
			});

			// Save the ptags object in the DOM, so we can access it.
			this.pines_steps = psteps;
		});

		return all_elements;
	};

	$.fn.psteps.defaults = {
		// Set how progress titles can be traversed.
		// 'always' = always have the ability to traverse all steps.
		// 'visited' = visited means the user has gone backwards and can
		// traverse steps already visited.
		// 'never' = never means the user cannot traverse steps other
		// than through progression.
		traverse_titles: "never",
		// If step names should be copied to step content and used as headings
		content_headings: false,
		// The element inside the content headings div to wrap around the step name. ie h4
		content_headings_element: 'h4',
		// If the content headings have an hr after them.
		content_headings_hr: true,
		// The placement for the content headings using after. ie '.some_class'
		// False if not used.
		// If a selector is specified but doesn't exist for every step or at all in the DOM tree, then
		// it will display at the beginning of a step by default.
		content_headings_after: false,
		// Step order is part of the step titles, defined by a class of "step-order".
		// When step order is true, step-order shows all the time. If shrink_step_names
		// is true, step order will show at specified viewport sizes even when step
		// order is false.
		step_order: true,
		// Step names will be hidden always if this statement is set to false,
		// but you can still specify step names so that content headings can still exist.
		step_names: true,
		// An option for checkmarks when things are completed.
		check_marks: true,
		// At specified screen size, steps_width_percentage will execute.
		alter_width_at_viewport: '1000',
		// Make width of step titles an even percentage for the number of steps.
		steps_width_percentage: false,
		// Make step title height equal the biggest height
		steps_height_equalize: false,
		// Make the step content height equal the biggest height
		content_height_equalize: false,
		// At specified screen size, shrink_step_names will execute.
		alter_names_at_viewport: '650',
		// Do not display step names in small viewports, just numbers.
		shrink_step_names: true,
		// Set if there is a back button.
		back: true,
		// Set the default step.
		step_start: "1",
		// Use the steps onload function to customize events that happen
		// when a step is loaded, or rather viewed the first time. (First time only).
		steps_onload: function(){},
		// The steps_show option is similar to the steps_onload function except that
		// it runs every time you go to a step. Be aware that the step shows and then calls this function.
		steps_show: function(){},
		// Execute this function right before we hide the active step (hiding this step to show another)
		steps_hide: function(){},
		// Go to the first incomplete step
		start_incomplete_step: false,
		// Go to the first step with a warning
		start_warning_step: false,
		// Go to the first step with an error
		start_error_step: false,
		// Function to determine that progress has been made (For titles
		// and for progression). This function received an argument 'step' which is
		// The current step it's checking for validation.
		// Making it really easy to do something like:
		// return (step.find('textarea').val() != '')
		// You can return true, false, 'warning', 'error'.
		// each step has a class of pstep# ie (pstep1). You can check if the step
		// has the class and then write a specific validation rule for that step.
		// you can throw errors by returning 'error' and an alert. You can use that
		// alert error message in place of the default by setting validate_use_error_msg
		// to false. That way you can create custom alert messages and have them work
		// as the alert when clicking next.
		validation_rule: function(){ return true; },
		// Validate the current step before advancing to the next step. must receive a return
		// true from the validation rule.
		validate_next_step: true,
		// Validate all steps before submitting.
		validate_submit_all_steps: true,
		// Validation for errors. If validating next step is off, this is still true.
		// Also if validating for next step, and this is false, then it will use the normal
		// next_step validation. Unless you use the option ignore_errors_on_next.
		// This will not affect traversing titles.
		validate_errors: true,
		// Ignores validating errors on next. so if validate_next_step is true, but this
		// option is set to true, it will completely ignore the error. Useful for allowing
		// progression but showing incorrect answers (on a test).
		ignore_errors_on_next: false,
		// Option to ignore errors on submit (corresponds to validate_submit_all_steps)
		ignore_errors_on_submit: false,
		// Default validation error message. You can change it...
		validate_error_msg: 'There was an error processing the step.',
		// Use validate error message. If you don't use it, but you DO
		// use the validate_errors option, the error message will be
		// whatever alert you used on that step, if you used one.
		validate_use_error_msg: true,
		// If we want use alerts/notices before submit.
		use_before_submit: true,
		// The alert text to display to the user when the steps fail validation.
		before_submit: 'Please complete all of the required steps before submitting.',
		// If we want use alerts/notices before next
		use_before_next: true,
		// The alert text to display to the user when the step fails validation.
		before_next: 'Please complete this step before advancing to the next step.',
		// This function callback is triggered when the event "load_after_steps"
		// fired on the psteps object. Ideally, you'd use this on the submit button.
		// In the function you could write an ajax call to submit the form, but then
		// display to the user a message, maybe depending on the success or failure
		// of the ajax call to save the form contents.
		load_after_steps: function(){}
	};
})(jQuery);
