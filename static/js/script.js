$(document).ready(function() {
    // Phone number validation - allow 10 digits or 11 digits with leading 0
    const phoneRegex = /^(\d{10}|0\d{10})$/;
    let deleteContactId = null;
    let searchTimeout = null;
    
    // Theme switching functionality
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check if user previously selected a theme
    if(localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    // Listen for toggle changes
    themeToggle.addEventListener('change', function(e) {
        if(e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
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
        
        // Allow 10 digits or 11 digits with leading 0
        if (phone.length === 10 || (phone.length === 11 && phone.startsWith('0'))) {
            $(this).removeClass('is-invalid');
            $('#phone-error').hide();
            $('#saveContactBtn').prop('disabled', false);
        } else {
            $(this).addClass('is-invalid');
            $('#phone-error').text('Phone number must be 10 digits or 11 digits starting with 0').show();
            $('#saveContactBtn').prop('disabled', true);
        }
    });
    
    // Real-time validation for phone number in edit form
    $('#edit-phone').on('input', function() {
        const phone = $(this).val().replace(/\D/g, '');
        $(this).val(phone); // Keep only digits
        
        // Allow 10 digits or 11 digits with leading 0
        if (phone.length === 10 || (phone.length === 11 && phone.startsWith('0'))) {
            $(this).removeClass('is-invalid');
            $('#edit-phone-error').hide();
            $('#updateContactBtn').prop('disabled', false);
        } else {
            $(this).addClass('is-invalid');
            $('#edit-phone-error').text('Phone number must be 10 digits or 11 digits starting with 0').show();
            $('#updateContactBtn').prop('disabled', true);
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
        let prefix = $('#edit-prefix').val();
        let phone = $('#edit-phone').val();
        const email = $('#edit-email').val();
        const address = $('#edit-address').val();
        
        // Handle if phone has a leading 0 - move it to prefix only when saving
        if (phone.startsWith('0') && phone.length === 11) {
            // Only add 0 to prefix if prefix is empty
            if (prefix && prefix.trim() !== '') {
                // If prefix exists, just remove the 0 from phone
                phone = phone.substring(1);
            } else {
                // If no prefix, move 0 to prefix
                prefix = '0' + prefix;
                phone = phone.substring(1);
            }
        }
        
        // Validate phone number
        if (!phoneRegex.test(phone) && !phoneRegex.test('0' + phone)) {
            $('#edit-phone').addClass('is-invalid');
            $('#edit-phone-error').text('Phone number must be 10 digits or 11 digits starting with 0').show();
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
            success: function(response) {
                $('#deleteContactModal').modal('hide');
                
                // Find the contact card container and remove it with animation
                const contactElement = $(`.delete-contact[data-id="${deleteContactId}"]`).closest('.col-xl-4');
                
                // Debug info to console
                console.log("Deleting contact with ID:", deleteContactId);
                console.log("Contact element found:", contactElement.length);
                
                // Animate and remove
                contactElement.fadeOut(300, function() {
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
                
                // Show success toast
                $('.toast').toast('show');
            },
            error: function(xhr) {
                $('#deleteContactModal').modal('hide');
                alert('Error deleting contact. Please try again.');
            }
        });
    });
    
    // Real-time search functionality
    $('#search-input').on('input', function() {
        const query = $(this).val().trim();
        
        // Show/hide clear button
        if (query.length > 0) {
            $('#clear-search').show();
        } else {
            $('#clear-search').hide();
        }
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // Set new timeout to avoid making too many requests while typing
        searchTimeout = setTimeout(function() {
            // Make AJAX request to search API
            $.ajax({
                url: '/api/search',
                type: 'GET',
                data: { query: query },
                success: function(contacts) {
                    // Clear existing contacts
                    $('.contacts-grid').empty();
                    
                    if (contacts.length === 0) {
                        // Show no results message
                        $('.contacts-grid').html(`
                            <div class="col-12 text-center no-contacts">
                                <i class="fas fa-search fa-4x mb-3"></i>
                                <h3>No contacts found</h3>
                                <p>Try a different search term or add a new contact.</p>
                            </div>
                        `);
                    } else {
                        // Update total contacts count
                        $('#total-contacts').text(contacts.length);
                        
                        // Render each contact
                        contacts.forEach(function(contact) {
                            const contactCard = `
                                <div class="col-xl-4 col-lg-6 col-md-12 mb-4">
                                    <div class="card contact-card h-100">
                                        <div class="card-body">
                                            <div class="contact-avatar">
                                                <span>${contact.name[0].toUpperCase()}</span>
                                            </div>
                                            <h5 class="card-title">${contact.name}</h5>
                                            <div class="contact-info">
                                                <p><i class="fas fa-phone me-2"></i>${contact.prefix || ''} ${contact.phone.substring(0, 5)} ${contact.phone.substring(5)}</p>
                                                ${contact.email ? `<p><i class="fas fa-envelope me-2"></i>${contact.email}</p>` : ''}
                                                ${contact.address ? `<p><i class="fas fa-map-marker-alt me-2"></i>${contact.address}</p>` : ''}
                                            </div>
                                            <div class="contact-actions">
                                                <button class="btn btn-sm btn-primary edit-contact" 
                                                        data-id="${contact._id}"
                                                        data-name="${contact.name}"
                                                        data-prefix="${contact.prefix || ''}"
                                                        data-phone="${contact.phone}"
                                                        data-email="${contact.email || ''}"
                                                        data-address="${contact.address || ''}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger delete-contact" data-id="${contact._id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            $('.contacts-grid').append(contactCard);
                        });
                        
                        // Highlight search matches if there's a query
                        if (query) {
                            highlightSearchMatches(query);
                        }
                    }
                },
                error: function() {
                    alert('Error searching contacts. Please try again.');
                }
            });
        }, 300); // 300ms delay to reduce server load while typing
    });
    
    // Clear search
    $('#clear-search').on('click', function() {
        $('#search-input').val('').trigger('input');
    });
    
    // Highlight search matches in contact cards
    function highlightSearchMatches(query) {
        if (!query) return;
        
        // Highlight matches in name and phone
        $('.contact-card .card-title, .contact-card .contact-info p:first-child').each(function() {
            const text = $(this).text();
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            if (regex.test(text)) {
                const highlighted = text.replace(regex, '<span class="bg-warning">$1</span>');
                $(this).html(highlighted);
            }
        });
    }
    
    // Helper function to escape special characters in regex
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Add animation to search results
    if (new URLSearchParams(window.location.search).has('query')) {
        $('.contact-card').css('animation', 'fadeIn 0.5s ease-out');
    }
    
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
        
        const name = $('#name').val();
        let prefix = $('#prefix').val();
        let phone = $('#phone').val();
        const email = $('#email').val();
        const address = $('#address').val();
        
        // Handle if phone has a leading 0 - move it to prefix only when saving
        if (phone.startsWith('0') && phone.length === 11) {
            // Only add 0 to prefix if prefix is empty
            if (prefix && prefix.trim() !== '') {
                // If prefix exists, just remove the 0 from phone
                phone = phone.substring(1);
            } else {
                // If no prefix, move 0 to prefix
                prefix = '0' + prefix;
                phone = phone.substring(1);
            }
        }
        
        // Validate phone number
        if (!phoneRegex.test(phone) && !phoneRegex.test('0' + phone)) {
            $('#phone').addClass('is-invalid');
            $('#phone-error').text('Phone number must be 10 digits or 11 digits starting with 0').show();
            return false;
        }
        
        // Hide any previous error
        $('#add-contact-error').hide();
        
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
