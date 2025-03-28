$(document).ready(function() {
    // Phone number validation
    const phoneRegex = /^\d{10}$/;
    let deleteContactId = null;
    
    // Format phone number based on prefix
    function formatPhoneNumber(prefix, phone) {
        if (!phone) return '';
        
        // Format based on country prefix
        if (prefix === '+1') {
            // US format: XXX-XXX-XXXX
            return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (prefix === '+44') {
            // UK format: XXXX XXXXXX
            return phone.replace(/(\d{4})(\d{6})/, '$1 $2');
        } else {
            // Default format (India, etc): XXXXX XXXXX
            return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
        }
    }
    
    // Real-time validation for phone number in add form
    $('#phone').on('input', function() {
        const phone = $(this).val().replace(/\D/g, '');
        $(this).val(phone); // Keep only digits
        
        if (phone.length !== 10) {
            $(this).addClass('is-invalid');
            $('#phone-error').show();
            $('#saveContactBtn').prop('disabled', true);
        } else {
            $(this).removeClass('is-invalid');
            $('#phone-error').hide();
            $('#saveContactBtn').prop('disabled', false);
        }
    });
    
    // Real-time validation for phone number in edit form
    $('#edit-phone').on('input', function() {
        const phone = $(this).val().replace(/\D/g, '');
        $(this).val(phone); // Keep only digits
        
        if (phone.length !== 10) {
            $(this).addClass('is-invalid');
            $('#edit-phone-error').show();
            $('#updateContactBtn').prop('disabled', true);
        } else {
            $(this).removeClass('is-invalid');
            $('#edit-phone-error').hide();
            $('#updateContactBtn').prop('disabled', false);
        }
    });
    
    // Handle prefix change - update phone number format
    $('#prefix, #edit-prefix').on('change', function() {
        const prefix = $(this).val();
        const phoneField = $(this).attr('id') === 'prefix' ? $('#phone') : $('#edit-phone');
        const phone = phoneField.val();
        
        if (phone.length === 10) {
            // Just visual feedback that format will change
            phoneField.addClass('text-primary').delay(300).queue(function() {
                $(this).removeClass('text-primary').dequeue();
            });
        }
    });
    
    // Open edit contact modal
    $('.contacts-grid').on('click', '.edit-contact', function() {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const prefix = $(this).data('prefix');
        const phone = $(this).data('phone');
        const email = $(this).data('email');
        const address = $(this).data('address');
        
        $('#edit-id').val(id);
        $('#edit-name').val(name);
        $('#edit-prefix').val(prefix);
        $('#edit-phone').val(phone);
        $('#edit-email').val(email);
        $('#edit-address').val(address);
        
        // Reset validation state
        $('#edit-phone').removeClass('is-invalid');
        $('#edit-phone-error').hide();
        $('#updateContactBtn').prop('disabled', false);
        
        $('#editContactModal').modal('show');
    });
    
    // Handle edit contact form submission
    $('#editContactForm').on('submit', function(e) {
        e.preventDefault();
        
        const id = $('#edit-id').val();
        const name = $('#edit-name').val();
        const prefix = $('#edit-prefix').val();
        const phone = $('#edit-phone').val();
        const email = $('#edit-email').val();
        const address = $('#edit-address').val();
        
        // Validate phone number
        if (!phoneRegex.test(phone)) {
            $('#edit-phone').addClass('is-invalid');
            $('#edit-phone-error').show();
            return false;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('prefix', prefix);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('address', address);
        
        // Send AJAX request
        $.ajax({
            url: `/contacts/${id}`,
            type: 'PUT',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#editContactModal').modal('hide');
                // Reload page to show updated contact
                location.reload();
            },
            error: function(xhr) {
                const error = xhr.responseJSON.error;
                alert(`Error: ${error}`);
            }
        });
    });
    
    // Open delete confirmation modal
    $('.contacts-grid').on('click', '.delete-contact', function() {
        deleteContactId = $(this).data('id');
        $('#deleteContactModal').modal('show');
    });
    
    // Handle delete contact confirmation
    $('#confirmDeleteBtn').on('click', function() {
        if (!deleteContactId) return;
        
        $.ajax({
            url: `/contacts/${deleteContactId}`,
            type: 'DELETE',
            success: function() {
                $('#deleteContactModal').modal('hide');
                // Remove the contact card from DOM
                $(`.contact-card[data-id="${deleteContactId}"]`).closest('.col-xl-4').fadeOut(300, function() {
                    $(this).remove();
                    // Update total contacts count
                    const totalContacts = $('.contact-card').length;
                    $('#total-contacts').text(totalContacts);
                    
                    // Show "no contacts" message if all contacts are deleted
                    if (totalContacts === 0) {
                        $('.contacts-grid').html(`
                            <div class="col-12 text-center no-contacts">
                                <i class="fas fa-address-book fa-4x mb-3"></i>
                                <h3>No contacts found</h3>
                                <p>Start by adding a new contact using the button on the left.</p>
                            </div>
                        `);
                    }
                });
            },
            error: function() {
                alert('Error deleting contact. Please try again.');
            }
        });
    });
    
    // Advanced search functionality
    // Highlight search matches in contact cards
    function highlightSearchMatches() {
        const query = new URLSearchParams(window.location.search).get('query');
        if (!query) return;
        
        // Highlight matches in name and phone
        $('.contact-card .card-title, .contact-card .contact-info p:first-child').each(function() {
            const text = $(this).text();
            const regex = new RegExp(`(${query})`, 'gi');
            if (regex.test(text)) {
                const highlighted = text.replace(regex, '<span class="bg-warning">$1</span>');
                $(this).html(highlighted);
            }
        });
    }
    
    // Call highlight function on page load
    highlightSearchMatches();
    
    // Add animation to search results
    if (new URLSearchParams(window.location.search).has('query')) {
        $('.contact-card').css('animation', 'fadeIn 0.5s ease-out');
    }
    
    // Real-time search (optional enhancement)
    let searchTimeout;
    $('input[name="query"]').on('input', function() {
        const query = $(this).val().trim();
        clearTimeout(searchTimeout);
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(function() {
                // Submit the search form
                $('form[action="/search"]').submit();
            }, 500);
        }
    });
    
    // Enhance UX with keyboard shortcuts
    $(document).keydown(function(e) {
        // Alt+N to add new contact
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            $('#addContactModal').modal('show');
        }
        
        // Alt+F to focus search
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            $('input[name="query"]').focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            $('.modal').modal('hide');
        }
    });
    
    // Show tooltips for keyboard shortcuts
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Add contact form validation
    $('#addContactForm').on('submit', function(e) {
        e.preventDefault();
        const phone = $('#phone').val();
        
        // Validate phone number
        if (!phoneRegex.test(phone)) {
            $('#phone').addClass('is-invalid');
            $('#phone-error').show();
            return false;
        }
        
        // Hide any previous error
        $('#add-contact-error').hide();
        
        // Get form data
        const name = $('#name').val();
        const prefix = $('#prefix').val();
        const email = $('#email').val();
        const address = $('#address').val();
        
        // Create form data object
        const formData = new FormData();
        formData.append('name', name);
        formData.append('prefix', prefix);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('address', address);
        
        // Send AJAX request
        $.ajax({
            url: '/contacts',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                // Close modal and reload page to show new contact
                $('#addContactModal').modal('hide');
                location.reload();
            },
            error: function(xhr) {
                // Display error message in the modal
                const error = xhr.responseJSON.error;
                $('#add-contact-error-message').text(error);
                $('#add-contact-error').show();
                
                // Scroll to the top of the modal to make error visible
                $('.modal-body').scrollTop(0);
            }
        });
    });
});
