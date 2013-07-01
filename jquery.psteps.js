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
			psteps.make_step_content_headings = function(){
				psteps.find('.step-title').each(function(r){
					var step_name = $(this).find('.step-name'),
						step_content = psteps.find('.step-content').eq(r);
					if (step_name.length == 1) {
						var hr = opts.content_headings_hr ? '<hr/>' : '',
							heading = '<div class="step-content-name"><'+opts.content_headings_element+'>'+step_name.html()+'</'+opts.content_headings_element+'>'+hr+'</div>'
						if (opts.content_headings_after != false && step_content.find(opts.content_headings_after).length > 0)
							step_content.find(opts.content_headings_after).after(heading)
						else
							step_content.prepend(heading);
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
					title.addClass(class_to_add);
					// Titles are always colored to indicate progress for present/past steps
					// If you can click titles, colored progress will indicate for future steps too.
					// Custom traversal still searches steps-visited to know what to validate for, and remember this part does not handle traversal, but validation.
					// We want to validate for steps besides the custom ones, we just dont want users to go to steps that havent been saved yet (and refreshed to just a view.).
					var validate_result;
					if ((opts.traverse_titles == 'visited' && title.hasClass('step-visited')) || (opts.traverse_titles == 'custom' && title.hasClass('step-visited')) || (opts.traverse_titles == 'never' && title.hasClass('step-visited')) || opts.traverse_titles == 'always') {
						validate_result = opts.validation_rule.call(cur_step);
						if (validate_result == 'warning') {
							title.removeClass('step-error btn-info btn-success btn-warning btn-danger step-info-error step-info-incomplete').addClass('step-warning step-info-warning');
							psteps.trigger_error(cur_step);
						} else if (validate_result == 'error') {
							title.removeClass('step-warning btn-info btn-success btn-warning btn-danger step-info-incomplete step-info-warning').addClass('step-error step-info-error');
							psteps.trigger_error(cur_step);
						} else if (validate_result) {
							title.removeClass('step-warning btn-info btn-warning btn-danger step-error step-info-error step-info-incomplete step-info-warning').addClass('btn-success')
							if (opts.check_marks)
								title.find('i.step-mark').remove().end().prepend('<i class="icon-ok step-mark"></i> ');
						} else if (!validate_result) {
							title.removeClass('step-warning btn-info btn-success btn-danger btn-warning step-error step-info-error step-info-warning')
								.addClass('btn-info step-info-incomplete')
								.find('i.step-mark').remove();
						}
					} else {
						validate_result = opts.validation_rule.call(cur_step);
						if (validate_result == 'warning') {
							title.removeClass('step-info-incomplete step-info-error').addClass('step-info-warning');
						} else if (validate_result == 'error') {
							title.removeClass('step-info-incomplete step-info-warning').addClass('step-info-error');
							psteps.trigger_error(cur_step);
						} else if (validate_result) {
							title.removeClass('step-info-error step-info-incomplete step-info-warning');
						} else if (!validate_result) {
							title.removeClass('step-info-error step-info-warning').addClass('step-info-incomplete')
						}
					}
				});
				psteps.toggle_buttons_function();
				psteps.trigger('validation_complete.psteps');
			};

			// Function for toggling send/next buttons as btn-success or btn-info.
			psteps.toggle_buttons_function = function(){
				// Get proper button name
				var next_name = next_button.attr('data-btn-name'),
					send_name = send_button.attr('data-btn-name'),
					back_name = back_button.attr('data-btn-name');
					
				if (next_name != undefined && next_name.length)
					next_button.html(next_name);
				if (send_name != undefined && send_name.length)
					send_button.html(send_name);
				if (back_name != undefined && back_name.length)
					back_button.html(back_name);
				
				// Toggle whether to show send or next.
				if (psteps.find('.step-content').last().hasClass('step-active')) {
					if (!next_button.hasClass('btn-manual'))
						next_button.hide();
					if (!send_button.hasClass('btn-manual'))
						send_button.show();
				} else {
					if (!next_button.hasClass('btn-manual'))
						next_button.show();
					if (!send_button.hasClass('btn-manual'))
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
			};

			// Function to go to a certain step
			psteps.go_to_step = function(step_num){
				var last_active_title = psteps.find('.step-title.last-active'),
					last_active_content = psteps.find('.step-content.last-active'),
					active_step = psteps.find('.step-content.step-active'),
					active_title = psteps.find('.step-title.step-active');

				if (step_num > num_steps)
					return;

				var show_step = psteps.find('.step-content').eq(step_num-1),
					show_title = psteps.find('.step-title').eq(step_num-1);

				// If you're at go to step, and there's step-resumes, the step-transition-processing
				// was not removed. Remove step-resume class if you don't want to remove the step
				// transition processing class.
				if (psteps.find('.step-resume').length) {
					psteps.find('.step-transition-processing').removeClass('step-transition-processing');
				}
				if (active_title.hasClass('step-transition') && !psteps.find('.step-resume').length && !first_time)
					opts.steps_transition.call(active_step);
				if (active_title.hasClass('step-transition-processing')) {
					psteps.find('.step-resume').removeClass('step-resume');
					show_title.addClass('step-resume');
					return;
				} else
					psteps.find('.step-resume').removeClass('step-resume');

				if (!first_time)
					opts.steps_hide.call(active_step);

				last_active_title.removeClass('last-active');
				last_active_content.removeClass('last-active');

				active_step.hide().removeClass('step-active').addClass('last-active');
				show_step.show().addClass('step-active step-visited');
				
				active_title.removeClass('step-active').addClass('disabled last-active');
				show_title.addClass('step-active step-visited').removeClass('disabled');
				
				// Every step before this one must get step-visited now. This is because if I had step traversal set to visited
				// and I started on step3, I could never see step1 and step2, which if that was the desired affect, those steps should
				// instead be given a no-traverse class. I should be able to to "go back" to steps prior to the one I am on.
				show_step.prevAll('.step-content').addClass('step-visited');
				show_title.prevAll('.step-title').addClass('step-visited');
				
				if (!show_step.hasClass('step-loaded'))
					opts.steps_onload.call(show_step);
				
				show_step.addClass('step-loaded');
				
				opts.steps_show.call(show_step);

				// If visited traversing,
				if (opts.traverse_titles == 'visited') {
					show_title.prevAll('.step-title').andSelf().css('cursor', 'pointer');
				}

				// Don't validate upon loading the first time.
				if (first_time)
					first_time = false;
				else
					psteps.trigger('validate.psteps');
				psteps.toggle_buttons_function();
			};

			// Function to go to the next step (calls go to step)
			psteps.go_to_next_step = function(){
				var preceeding_titles = psteps.find('.step-title.step-active').prevAll('.step-title');
				if (opts.skip_no_traverse_on_next) {
					var next_step = psteps.find('.step-title').eq(preceeding_titles.length + 1);
					if (next_step.hasClass('step-notraverse')) {
						var new_next_step = next_step.nextAll('.step-title:not(.step-notraverse)').first().prevAll('.step-title').length + 1;
						psteps.go_to_step(new_next_step);
					} else
						psteps.go_to_step(preceeding_titles.length + 2);
				} else
					psteps.go_to_step(preceeding_titles.length + 2);
					
			};

			// Function to go to the next step (calls go to step)
			psteps.go_to_prev_step = function(){
				var preceeding_titles = psteps.find('.step-title.step-active').prevAll('.step-title');
				psteps.go_to_step(preceeding_titles.length);
			};

			// Function to set or change the way titles are traversed. Used by
			// the binding events that can be triggered to change the type.
			psteps.change_traverse = function(type){
				var custom = opts.custom_traverse_class;
				var step_titles = psteps.find('.step-title');
				psteps.off('click', '.step-title:not(.step-notraverse)');
				psteps.off('click', '.step-title.step-active:not(.step-notraverse)');
				psteps.off('click', '.step-title.step-visited:not(.step-notraverse)');
				if (type == 'always') {
					step_titles.css('cursor', 'pointer');
					psteps.on('click', '.step-title:not(.step-notraverse)', function(){
						var clicked_title = $(this),
							all_prev = clicked_title.prevAll('.step-title');
						psteps.go_to_step(all_prev.length + 1);
					});
				} else if (type == 'custom') {
					var selector1 = "."+custom;
					var selector2 = ".step-title."+custom+":not(.step-notraverse)";
					step_titles.css('cursor', 'default').filter(selector1).css('cursor', 'pointer');
					psteps.on('click', selector2, function(){
						var clicked_title = $(this);
						// if the title is the "next" title from the current view,
						// trigger next.
						// if the title is the "previous" title from the current view,
						// trigger previous.
						if (clicked_title.prevAll('.step-title:first').hasClass('step-active'))
							psteps.go_to_next_step();
						else if (clicked_title.nextAll('.step-title:first').hasClass('step-active'))
							psteps.go_to_prev_step();
						else {
							var all_prev = clicked_title.prevAll('.step-title');
							psteps.go_to_step(all_prev.length + 1);
						}
					});
				} else if (type == 'visited') {
					step_titles.css('cursor', 'default').filter('.step-visited').css('cursor', 'pointer');
					psteps.on('click', '.step-title.step-visited:not(.step-notraverse)', function(){
						var clicked_title = $(this);
						// if the title is the "next" title from the current view,
						// trigger next.
						// if the title is the "previous" title from the current view,
						// trigger previous.
						if (clicked_title.prevAll('.step-title:first').hasClass('step-active'))
							psteps.go_to_next_step();
						else if (clicked_title.nextAll('.step-title:first').hasClass('step-active'))
							psteps.go_to_prev_step();
						else {
							var all_prev = clicked_title.prevAll('.step-title');
							psteps.go_to_step(all_prev.length + 1);
						}
					});
				} else if (type == 'never') {
					step_titles.css('cursor', 'default');
					// this is for never, which this is actually super useful.
					// It allows the user to click on the current step, which
					// may trigger the alert for why a step is showing a warning
					// or an error. Because the "next" button on errors will
					// trigger a click on this step (which shows the error message)
					// from the validation rule. This allows for unique error
					// messages to show on the next button.
					psteps.on('click', '.step-title.step-active:not(.step-notraverse)', function(){
						var clicked_title = $(this),
							all_prev = clicked_title.prevAll('.step-title');
						psteps.go_to_step(all_prev.length + 1);
					});
				}
				step_titles.filter('.step-notraverse').css('cursor', 'default');
			};


			// Trigger Error in Title
			psteps.trigger_error = function(step){
				var step_num = step.prevAll('.step-content').length + 1,
					title = psteps.find('.step-title').eq(step_num-1);
				if (title.hasClass('step-warning')) {
					title.removeClass('btn-info btn-success').addClass('btn-warning')
					if (opts.check_marks)
						title.find('i.step-mark').remove().end().prepend('<i class="icon-remove step-mark"></i> ');
				} else if (title.hasClass('step-error')) {
					title.removeClass('btn-info btn-success').addClass('btn-danger')
					if (opts.check_marks)
						title.find('i.step-mark').remove().end().prepend('<i class="icon-remove step-mark"></i> ');
				}
			};

			// Load necessary classes
			all_steps.hide().first().addClass('step-visited step-active').show();
			all_titles.addClass('disabled btn').first().addClass('step-visited step-active').removeClass('disabled');
			if (!opts.step_names)
				step_names.hide();
			// Load functions
			psteps.change_traverse(opts.traverse_titles);
			psteps.check_progress_titles();
			if (opts.content_headings)
				psteps.make_step_content_headings();

			// Load the default step
			var last;
			if (opts.start_incomplete_step) {
				var incomplete = psteps.find('.step-title.step-info-incomplete').first();
				if (incomplete.length)
					psteps.go_to_step(incomplete.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			} else if (opts.start_warning_step) {
				var warning = psteps.find('.step-title.step-info-warning').first();
				if (warning.length)
					psteps.go_to_step(warning.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			} else if (opts.start_error_step) {
				var error = psteps.find('.step-title.step-info-error').first();
				if (error.length)
					psteps.go_to_step(error.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			} else
				psteps.go_to_step(opts.step_start);


			// Event Triggers
			back_button.click(function(){
				if (opts.use_custom_back_button) {
					var previous_step_num = psteps.find('.step-title.step-active').prevAll('.step-title').length;
					opts.custom_back_button_click.call(undefined, previous_step_num);
				} else {
					psteps.go_to_prev_step();
				}
			});

			// Extremely useful for instant validation, for example, after a
			// user has completed an input on a step.
			var last_val_timestamp = 0;
			psteps.bind('validate.psteps', function(e){
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
			psteps.bind('traverse_never.psteps', function(){
				psteps.change_traverse('never');
			});

			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_always.psteps', function(){
				psteps.change_traverse('always');
			});

			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_visited.psteps', function(){
				psteps.change_traverse('visited');
			});
			
			// An event that triggers a change on how titles will be traversed.
			psteps.bind('traverse_custom.psteps', function(){
				psteps.change_traverse('custom');
			});

			// Loads the call back for what happens after steps, probably
			// when a submit button is pressed.
			psteps.bind('load_after_steps.psteps', function(){
				opts.load_after_steps.call(psteps);
			});

			// Have yet to find a use for this, but maybe it will be to someone.
			psteps.on('step_error.psteps', '.step-content', function(){
				psteps.trigger_error($(this));
			});

			// When triggered on a step, it will go there, despite traversal settings.
			psteps.on('go_to_step.psteps', '.step-title', function(){
				var cur_step = $(this),
					preceeding_titles = cur_step.prevAll('.step-title');
				psteps.go_to_step(preceeding_titles.length + 1);
			});

			// When triggered on psteps object, it goes to the first incomplete step. Or the last completed if none are incomplete.
			psteps.bind('go_to_first_incomplete.psteps', function(){
				var incomplete = psteps.find('.step-title.step-info-incomplete').first();
				if (incomplete.length)
					psteps.go_to_step(incomplete.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			});

			// When triggered on psteps object, it goes to the first step with an warning. Or the last completed if none are warnings.
			psteps.bind('go_to_first_warning.psteps', function(){
				var warning = psteps.find('.step-title.step-info-warning').first();
				if (warning.length)
					psteps.go_to_step(warning.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			});

			// When triggered on psteps object, it goes to the first step with an error. Or the last completed if none are errors.
			psteps.bind('go_to_first_error.psteps', function(){
				var error = psteps.find('.step-title.step-info-error').first();
				if (error.length)
					psteps.go_to_step(error.prevAll('.step-title').length + 1);
				else {
					last = psteps.find('.step-title.btn-success').last();// it will go to the last completed if nothing is incomplete
					psteps.go_to_step(last.prevAll('.step-title').length + 1);
				}
			});

			// Submit or Next. Checks for success in order to progress. Stops submit if fails.
			toggle_buttons.click(function(e){
				var this_button = $(this);
				if (this_button.hasClass(opts.btn_wait_class)) {
					setTimeout(function(){
						// Just to make sure that the validation ran and titles are correct run check titles.
						psteps.trigger('validate.psteps');
						var active_title = psteps.find('.step-title.step-active');
						if (active_title.hasClass('step-error') && opts.validate_errors && !opts.validate_next_step) {
							if (opts.validate_use_error_msg)
								alert(opts.validate_error_msg)
							else
								active_title.click();
						} else if (active_title.hasClass('step-error') && opts.validate_next_step && !opts.ignore_errors_on_next)
							$.noop(); //do nothing.
						else if (active_title.hasClass('step-error') && opts.ignore_errors_on_next)
							psteps.go_to_next_step();
						else if (this_button.hasClass('btn-success'))
							psteps.go_to_next_step();
						else if (this_button.hasClass('submit-button') && (opts.validate_submit_all_steps || opts.validate_next_step)) {
							if (opts.use_before_submit)
								alert(opts.before_submit);
							e.preventDefault();
						} else if (opts.validate_next_step && opts.use_before_next)
							alert(opts.before_next);
						else
							psteps.go_to_next_step();
					}, opts.btn_wait_time);
				} else {
					// Just to make sure that the validation ran and titles are correct run check titles.
					psteps.trigger('validate.psteps');
					var active_title = psteps.find('.step-title.step-active');
					if (active_title.hasClass('step-error') && opts.validate_errors && !opts.validate_next_step) {
						if (opts.validate_use_error_msg)
							alert(opts.validate_error_msg)
						else
							active_title.click();
					} else if (active_title.hasClass('step-error') && opts.validate_next_step && !opts.ignore_errors_on_next)
						$.noop(); //do nothing.
					else if (active_title.hasClass('step-error') && opts.ignore_errors_on_next)
						psteps.go_to_next_step();
					else if (this_button.hasClass('btn-success'))
						psteps.go_to_next_step();
					else if (this_button.hasClass('submit-button') && (opts.validate_submit_all_steps || opts.validate_next_step)) {
						if (opts.use_before_submit)
							alert(opts.before_submit);
						e.preventDefault();
					} else if (opts.validate_next_step && opts.use_before_next)
						alert(opts.before_next);
					else
						psteps.go_to_next_step();
				}
				
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
		// If set to 'custom', only steps with your custom_traverse_class will be traversable.
		traverse_titles: 'never',
		// Custom class you can put on your step titles to use to limit traversal. Set traverse_titles to 'custom'. 
		custom_traverse_class: 'custom-traverse',
		// Always have access the first incomplete step always, regardless of step traversal settings.// TO DO
		//traverse_first_incomplete: true, TO DO
		// If step title has step-notraverse, do not allow the previous step to get to it, instead have it go to the next available.
		skip_no_traverse_on_next: true,
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
		// Set if you want to use a special back button function callback on the click event
		use_custom_back_button: false,
		// the function passes the previous step num in the num
		custom_back_button_click: function(){},
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
		// This function is used for creating transitions between steps. It is ran before steps_hide. You need
		// to add the class 'step-transition' to the step-title you are transitioning from for this to be called.
		// You also need to add the class in this function 'step-transition-processing' to prevent the transition.
		// Which ever step that was going to be transitioned to will have a 'step-resume' class on the title.
		// Once you remove 'step-transition-processing and trigger the event go_to_step.psteps on the step-resume title, 
		// you'll have transitioned. This function definitely has a manual operation to it, but it is useful
		steps_transition: function(){},
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
		// Add a specific class to the submit, back, next buttons to wait.
		btn_wait_class: 'btn-wait',
		// Specify the amount of time to wait before executing the button's task if the btn_wait_class has been applied.
		btn_wait_time: 1000,
		// This function callback is triggered when the event "load_after_steps"
		// fired on the psteps object. Ideally, you'd use this on the submit button.
		// In the function you could write an ajax call to submit the form, but then
		// display to the user a message, maybe depending on the success or failure
		// of the ajax call to save the form contents.
		load_after_steps: function(){}
	};
})(jQuery);
