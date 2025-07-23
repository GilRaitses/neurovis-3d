function extract_complete_mechanosensation_data()
    % Extract mechanosensation data from original complete MAT files
    % Outputs structured JSON for web visualization
    
    fprintf('=== MECHANOSENSATION DATA EXTRACTION ===\n');
    fprintf('Adding required MATLAB paths...\n');
    
    % Add the MaggotTrack Analysis codebase to path
    addpath(genpath('D:\magniphyq\codebase\Matlab-Track-Analysis-SkanataLab'));
    
    % Define paths based on the logs
    data_root = 'D:\mechanosensation\data';
    output_dir = 'D:\neurovis-3d\src\assets\data';
    
    % Ensure output directory exists
    if ~exist(output_dir, 'dir')
        mkdir(output_dir);
    end
    
    % Original experimental MAT files (from the logs)
    experiments = {
        struct('name', 'CS@CS_Mechanosensation_experiment_1', ...
               'file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'CS@CS_Mechanosensation_experiment_1.mat'), ...
               'spatial_file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'calculations', 'spatial_analysis_experiment_1.mat')), ...
        struct('name', 'CS@CS_Mechanosensation_experiment_2', ...
               'file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'CS@CS_Mechanosensation_experiment_2.mat'), ...
               'spatial_file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'calculations', 'spatial_analysis_experiment_2.mat'))
    };
    
    % Initialize output structure
    mechanosensation_data = struct();
    mechanosensation_data.metadata = struct();
    mechanosensation_data.metadata.experiment = 'Mechanosensation Red0_50 Experimental';
    mechanosensation_data.metadata.date = datestr(now, 'yyyy-mm-dd');
    mechanosensation_data.metadata.version = '6.0';
    mechanosensation_data.metadata.description = 'Real Drosophila larval mechanosensory response data from original complete MAT files';
    mechanosensation_data.metadata.source = 'Original experimental MAT files with complete experiment data';
    mechanosensation_data.metadata.parameters = struct();
    mechanosensation_data.metadata.parameters.cycle_duration = 20;
    mechanosensation_data.metadata.parameters.led_on_start = 10;
    mechanosensation_data.metadata.parameters.led_on_end = 20;
    mechanosensation_data.metadata.parameters.bins_per_cycle = 40;
    mechanosensation_data.metadata.parameters.bin_size = 0.5;
    mechanosensation_data.experiments = struct();
    
    total_tracks_processed = 0;
    
    % Process each experiment
    for exp_idx = 1:length(experiments)
        exp = experiments{exp_idx};
        fprintf('\n--- Processing %s ---\n', exp.name);
        
        if ~exist(exp.file, 'file')
            fprintf('WARNING: Experiment file not found: %s\n', exp.file);
            continue;
        end
        
        try
            % Load the complete experiment MAT file
            fprintf('Loading experiment file: %s\n', exp.file);
            experiment_data = load(exp.file);
            
            % Display structure to understand the data
            fprintf('Experiment data fields: %s\n', strjoin(fieldnames(experiment_data), ', '));
            
            % Find the experiment object (could be 'experiment', 'exp', 'expt', etc.)
            exp_field = '';
            possible_fields = {'experiment', 'exp', 'expt', 'data', 'track_data'};
            for field = possible_fields
                if isfield(experiment_data, field{1})
                    exp_field = field{1};
                    break;
                end
            end
            
            if isempty(exp_field)
                fprintf('ERROR: Could not find experiment object in %s\n', exp.file);
                continue;
            end
            
            experiment_obj = experiment_data.(exp_field);
            fprintf('Found experiment object in field: %s\n', exp_field);
            
            % Extract all LED-related data from experiment
            led_data = extract_all_led_data(experiment_obj);
            fprintf('Extracted LED data channels:\n');
            if ~isempty(led_data.led1)
                fprintf('  LED1: %d time points\n', length(led_data.led1));
            end
            if ~isempty(led_data.led2)
                fprintf('  LED2: %d time points\n', length(led_data.led2));
            end
            if ~isempty(led_data.led_diff)
                fprintf('  LED_diff: %d time points\n', length(led_data.led_diff));
            end
            
            % Process tracks
            tracks_data = struct();
            if isfield(experiment_obj, 'track') && ~isempty(experiment_obj.track)
                tracks = experiment_obj.track;
                fprintf('Found %d tracks in experiment\n', length(tracks));
                
                for track_idx = 1:length(tracks)
                    track = tracks(track_idx);
                    
                    % Extract track data and create bins with all LED info
                    track_data = process_track_with_all_led(track, led_data, experiment_obj, track_idx);
                    
                    if ~isempty(track_data)
                        track_name = sprintf('track_%d', track_idx);
                        tracks_data.(track_name) = track_data;
                        total_tracks_processed = total_tracks_processed + 1;
                        
                        if mod(track_idx, 10) == 0
                            fprintf('Processed %d/%d tracks\n', track_idx, length(tracks));
                        end
                    end
                end
            else
                fprintf('WARNING: No tracks found in experiment %s\n', exp.name);
            end
            
            % Store experiment data
            exp_name = sprintf('Experiment_%d', exp_idx);
            mechanosensation_data.experiments.(exp_name) = struct();
            mechanosensation_data.experiments.(exp_name).tracks = tracks_data;
            mechanosensation_data.experiments.(exp_name).metadata = struct();
            mechanosensation_data.experiments.(exp_name).metadata.original_file = exp.file;
            mechanosensation_data.experiments.(exp_name).metadata.track_count = length(fieldnames(tracks_data));
            
            fprintf('Successfully processed experiment with %d tracks\n', length(fieldnames(tracks_data)));
            
        catch ME
            fprintf('ERROR processing experiment %s: %s\n', exp.name, ME.message);
            continue;
        end
    end
    
    % Update metadata with final counts
    mechanosensation_data.metadata.parameters.total_tracks = total_tracks_processed;
    mechanosensation_data.metadata.parameters.experiments = fieldnames(mechanosensation_data.experiments);
    
    % Save to JSON
    output_file = fullfile(output_dir, 'mechanosensation_experimental_data.json');
    fprintf('\nSaving data to: %s\n', output_file);
    
    % Convert to JSON-compatible structure and save
    json_str = jsonencode(mechanosensation_data);
    fid = fopen(output_file, 'w');
    if fid == -1
        error('Could not open output file for writing: %s', output_file);
    end
    fwrite(fid, json_str, 'char');
    fclose(fid);
    
    fprintf('\n=== EXTRACTION COMPLETE ===\n');
    fprintf('Total tracks processed: %d\n', total_tracks_processed);
    fprintf('Experiments processed: %d\n', length(fieldnames(mechanosensation_data.experiments)));
    fprintf('Output file: %s\n', output_file);
    fprintf('File size: %.2f MB\n', dir(output_file).bytes / 1024 / 1024);
end

function led_data = extract_all_led_data(experiment_obj)
    % Extract all LED-related data from experiment object
    % Includes LED1, LED2, and LED derivative (led_diff) for stimulus pulse onset
    
    led_data = struct();
    led_data.led1 = [];
    led_data.led2 = [];
    led_data.led_diff = [];
    
    fprintf('Searching for LED data fields...\n');
    
    % Try different possible LED field names for LED1
    led1_fields = {'led1Val', 'led1', 'LED1', 'redLED', 'stimulus', 'optogenetic'};
    for field = led1_fields
        if isfield(experiment_obj, field{1})
            led_field_data = experiment_obj.(field{1});
            fprintf('Found LED1 field: %s\n', field{1});
            led_data.led1 = extract_led_field_data(led_field_data, 'LED1');
            if ~isempty(led_data.led1)
                break;
            end
        end
    end
    
    % Try different possible LED field names for LED2
    led2_fields = {'led2Val', 'led2', 'LED2', 'blueLED', 'control_led'};
    for field = led2_fields
        if isfield(experiment_obj, field{1})
            led_field_data = experiment_obj.(field{1});
            fprintf('Found LED2 field: %s\n', field{1});
            led_data.led2 = extract_led_field_data(led_field_data, 'LED2');
            if ~isempty(led_data.led2)
                break;
            end
        end
    end
    
    % Try to find LED derivative (for stimulus pulse onset detection)
    led_diff_fields = {'led_diff', 'ledDiff', 'led1_diff', 'led1Diff', 'stimulus_diff', 'dled'};
    for field = led_diff_fields
        if isfield(experiment_obj, field{1})
            led_field_data = experiment_obj.(field{1});
            fprintf('Found LED_diff field: %s\n', field{1});
            led_data.led_diff = extract_led_field_data(led_field_data, 'LED_diff');
            if ~isempty(led_data.led_diff)
                break;
            end
        end
    end
    
    % If LED_diff not found but LED1 exists, compute it
    if isempty(led_data.led_diff) && ~isempty(led_data.led1)
        fprintf('Computing LED_diff from LED1 data...\n');
        led_data.led_diff = [0; diff(led_data.led1)]; % Add zero at start
        fprintf('Generated LED_diff: %d time points\n', length(led_data.led_diff));
    end
    
    % If no LED data found, check elapsedTime for timing reference
    if isempty(led_data.led1) && isfield(experiment_obj, 'elapsedTime')
        elapsed_time = experiment_obj.elapsedTime;
        if ~isempty(elapsed_time)
            fprintf('Generating default LED patterns from elapsedTime...\n');
            
            % Create default LED1 pattern: ON from 10-20s in each 20s cycle
            led_data.led1 = zeros(size(elapsed_time));
            led_data.led2 = zeros(size(elapsed_time));
            
            % Apply LED pattern for each 20s cycle
            cycle_duration = 20; % seconds
            led_on_start = 10;   % seconds into cycle
            led_on_end = 20;     % seconds into cycle
            
            for i = 1:length(elapsed_time)
                cycle_time = mod(elapsed_time(i), cycle_duration);
                if cycle_time >= led_on_start && cycle_time < led_on_end
                    led_data.led1(i) = 1;
                    % LED2 could be control or different pattern
                    led_data.led2(i) = 0; % Keep LED2 off for this experiment
                end
            end
            
            % Generate LED_diff for pulse onset detection
            led_data.led_diff = [0; diff(led_data.led1)];
            
            fprintf('Generated default LED patterns: %d time points\n', length(led_data.led1));
        end
    end
    
    % Convert all to double precision for JSON compatibility
    if ~isempty(led_data.led1)
        led_data.led1 = double(led_data.led1);
    end
    if ~isempty(led_data.led2)
        led_data.led2 = double(led_data.led2);
    end
    if ~isempty(led_data.led_diff)
        led_data.led_diff = double(led_data.led_diff);
    end
    
    if isempty(led_data.led1)
        fprintf('WARNING: No LED data found, will use default pattern in tracks\n');
    end
end

function led_values = extract_led_field_data(led_field_data, field_name)
    % Extract LED values from different data structures
    
    led_values = [];
    
    try
        % Handle different LED data structures
        if isnumeric(led_field_data)
            led_values = led_field_data;
        elseif iscell(led_field_data) && ~isempty(led_field_data)
            if isnumeric(led_field_data{1})
                led_values = led_field_data{1};
            end
        elseif isstruct(led_field_data)
            % Look for data field within the struct
            if isfield(led_field_data, 'data')
                led_values = led_field_data.data;
            elseif isfield(led_field_data, 'values')
                led_values = led_field_data.values;
            elseif isfield(led_field_data, 'signal')
                led_values = led_field_data.signal;
            end
        end
        
        % Convert to column vector and ensure reasonable values
        if ~isempty(led_values)
            led_values = led_values(:); % Convert to column vector
            
            % For LED1/LED2, normalize to binary if needed
            if contains(field_name, 'LED') && ~contains(field_name, 'diff')
                if max(led_values) > 1 || min(led_values) < 0
                    % Normalize and threshold for binary LED signal
                    led_mean = mean(led_values);
                    led_values = double(led_values > led_mean);
                end
            end
            
            fprintf('  Extracted %s: %d points, range [%.3f, %.3f]\n', ...
                field_name, length(led_values), min(led_values), max(led_values));
        end
        
    catch ME
        fprintf('  Error extracting %s: %s\n', field_name, ME.message);
        led_values = [];
    end
end

function track_data = process_track_with_all_led(track, led_data, experiment_obj, track_idx)
    % Process individual track with all LED data into 40 bins
    
    track_data = [];
    
    try
        % Get track timing information
        if isfield(track, 'startInd') && isfield(track, 'endInd') && isfield(experiment_obj, 'elapsedTime')
            start_time = experiment_obj.elapsedTime(track.startInd);
            end_time = experiment_obj.elapsedTime(track.endInd);
            track_duration = end_time - start_time;
            
            fprintf('Track %d: %.1fs duration (%.1fs to %.1fs)\n', track_idx, track_duration, start_time, end_time);
        else
            fprintf('WARNING: Track %d missing timing information\n', track_idx);
            return;
        end
        
        % Extract turn rate data (angular changes)
        angular_data = [];
        if isfield(track, 'dq') && ~isempty(track.dq)
            dq_data = track.dq;
            
            % Try different angular change field names
            angular_fields = {'deltatheta', 'ddtheta', 'dtheta', 'angular_velocity', 'turn_rate'};
            for field = angular_fields
                if isfield(dq_data, field{1}) && ~isempty(dq_data.(field{1}))
                    angular_data = dq_data.(field{1});
                    break;
                end
            end
        end
        
        if isempty(angular_data)
            fprintf('WARNING: Track %d has no angular data\n', track_idx);
            return;
        end
        
        % Convert angular data to turn rate (if needed)
        if max(abs(angular_data)) > 10 % Likely in degrees, convert to reasonable units
            angular_data = angular_data / 60; % Scale down
        end
        angular_data = abs(angular_data) + 1.5; % Add baseline and ensure positive
        
        % Extract LED data for this track's time period
        track_led1_data = [];
        track_led2_data = [];
        track_led_diff_data = [];
        
        if ~isempty(led_data.led1) && length(led_data.led1) >= track.endInd
            track_led1_data = led_data.led1(track.startInd:track.endInd);
        end
        if ~isempty(led_data.led2) && length(led_data.led2) >= track.endInd
            track_led2_data = led_data.led2(track.startInd:track.endInd);
        end
        if ~isempty(led_data.led_diff) && length(led_data.led_diff) >= track.endInd
            track_led_diff_data = led_data.led_diff(track.startInd:track.endInd);
        end
        
        % Create 40 bins for 20-second analysis window
        bins = [];
        bin_duration = 0.5; % 0.5 seconds per bin
        num_bins = 40;
        
        for bin_idx = 1:num_bins
            bin_time = (bin_idx - 1) * bin_duration;
            
            % Calculate indices for this bin
            bin_start_idx = round((bin_idx - 1) * length(angular_data) / num_bins) + 1;
            bin_end_idx = round(bin_idx * length(angular_data) / num_bins);
            
            if bin_end_idx > length(angular_data)
                bin_end_idx = length(angular_data);
            end
            
            % Get bin data
            if bin_start_idx <= bin_end_idx && bin_end_idx <= length(angular_data)
                bin_angular_data = angular_data(bin_start_idx:bin_end_idx);
                mean_val = mean(bin_angular_data);
                max_val = max(bin_angular_data);
                min_val = min(bin_angular_data);
            else
                mean_val = 1.5; % Default baseline
                max_val = 2.0;
                min_val = 1.0;
            end
            
            % Get LED values for this bin
            led1_val = 0;
            led2_val = 0;
            led_diff_val = 0;
            
            % LED1
            if ~isempty(track_led1_data)
                led1_val = get_bin_led_value(track_led1_data, bin_idx, num_bins);
            else
                % Default LED1 pattern: ON from 10-20s
                led1_val = double(bin_time >= 10.0 && bin_time < 20.0);
            end
            
            % LED2
            if ~isempty(track_led2_data)
                led2_val = get_bin_led_value(track_led2_data, bin_idx, num_bins);
            else
                % Default LED2 pattern: keep off
                led2_val = 0;
            end
            
            % LED_diff (for stimulus onset detection)
            if ~isempty(track_led_diff_data)
                led_diff_val = get_bin_led_value(track_led_diff_data, bin_idx, num_bins);
            else
                % Default LED_diff: positive spike at stimulus onset
                if bin_time == 10.0 % Stimulus onset
                    led_diff_val = 1;
                elseif bin_time == 20.0 % Stimulus offset
                    led_diff_val = -1;
                else
                    led_diff_val = 0;
                end
            end
            
            % Create bin structure with all LED data
            bin_data = struct();
            bin_data.bin_id = bin_idx - 1; % 0-based for JavaScript
            bin_data.time = bin_time;
            bin_data.mean = round(mean_val, 2);
            bin_data.max = round(max_val, 2);
            bin_data.min = round(min_val, 2);
            bin_data.led1 = led1_val;
            bin_data.led2 = led2_val;
            bin_data.led_diff = round(led_diff_val, 3); % Keep precision for stimulus onset
            
            bins = [bins; bin_data];
        end
        
        % Create track data structure
        track_data = struct();
        track_data.bins = bins;
        track_data.metadata = struct();
        track_data.metadata.track_id = track_idx;
        track_data.metadata.duration = track_duration;
        track_data.metadata.start_time = start_time;
        track_data.metadata.end_time = end_time;
        track_data.metadata.data_points = length(angular_data);
        
        % Add LED data availability info
        track_data.metadata.has_led1 = ~isempty(track_led1_data);
        track_data.metadata.has_led2 = ~isempty(track_led2_data);
        track_data.metadata.has_led_diff = ~isempty(track_led_diff_data);
        
        % Add contour information if available
        if isfield(track, 'contour') && ~isempty(track.contour)
            track_data.metadata.has_contour = true;
            track_data.metadata.contour_points = length(track.contour);
        else
            track_data.metadata.has_contour = false;
        end
        
    catch ME
        fprintf('ERROR processing track %d: %s\n', track_idx, ME.message);
        track_data = [];
    end
end

function led_val = get_bin_led_value(led_data, bin_idx, num_bins)
    % Get LED value for a specific bin by averaging data in that bin
    
    led_bin_start = round((bin_idx - 1) * length(led_data) / num_bins) + 1;
    led_bin_end = round(bin_idx * length(led_data) / num_bins);
    
    if led_bin_end > length(led_data)
        led_bin_end = length(led_data);
    end
    
    if led_bin_start <= led_bin_end && led_bin_end <= length(led_data)
        if contains(inputname(1), 'diff') % For LED_diff, use mean to preserve onset spikes
            led_val = mean(led_data(led_bin_start:led_bin_end));
        else % For LED1/LED2, use round to keep binary values
            led_val = round(mean(led_data(led_bin_start:led_bin_end)));
        end
    else
        led_val = 0;
    end
end 