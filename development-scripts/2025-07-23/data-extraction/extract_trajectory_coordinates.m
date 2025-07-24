function extract_trajectory_coordinates()
    % Extract complete trajectory coordinates from original MAT files
    % Saves head, tail, and contour positions for each track and frame
    % Output: HDF5 format for efficient storage of large coordinate datasets
    
    fprintf('=== TRAJECTORY COORDINATES EXTRACTION ===\n');
    fprintf('Adding required MATLAB paths...\n');
    
    % Add the MaggotTrack Analysis codebase to path
    addpath(genpath('D:\magniphyq\codebase\Matlab-Track-Analysis-SkanataLab'));
    
    % Define paths
    data_root = 'D:\mechanosensation\data';
    output_dir = 'D:\neurovis-3d\src\assets\data';
    
    % Ensure output directory exists
    if ~exist(output_dir, 'dir')
        mkdir(output_dir);
    end
    
    % Create timestamped output filename
    timestamp = datestr(now, 'yyyy-mm-dd_HH-MM-SS');
    output_file = fullfile(output_dir, sprintf('trajectory_coordinates_%s.h5', timestamp));
    
    % Delete existing file if it exists
    if exist(output_file, 'file')
        delete(output_file);
    end
    
    % Original experimental MAT files
    experiments = {
        struct('name', 'CS@CS_Mechanosensation_experiment_1', ...
               'file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'CS@CS_Mechanosensation_experiment_1.mat')), ...
        struct('name', 'CS@CS_Mechanosensation_experiment_2', ...
               'file', fullfile(data_root, '03-Red0_50Experimental', 'Extracted Tracks', 'CS@CS_Mechanosensation', 'CS@CS_Mechanosensation_experiment_2.mat'))
    };
    
    % Initialize counters and metadata
    total_tracks_processed = 0;
    global_track_id = 1;
    experiment_metadata = struct();
    
    fprintf('\nProcessing %d experiments for trajectory extraction...\n', length(experiments));
    
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
            
            % Find the experiment object
            exp_field = find_experiment_field(experiment_data);
            if isempty(exp_field)
                fprintf('ERROR: Could not find experiment object in %s\n', exp.file);
                continue;
            end
            
            experiment_obj = experiment_data.(exp_field);
            fprintf('Found experiment object in field: %s\n', exp_field);
            
            % Extract frame timing information
            if isfield(experiment_obj, 'elapsedTime')
                frame_times = experiment_obj.elapsedTime;
                fprintf('Frame timing: %d time points, %.1fs total duration\n', ...
                    length(frame_times), max(frame_times));
            else
                fprintf('WARNING: No frame timing information found\n');
                frame_times = [];
            end
            
            % Process tracks in this experiment
            if isfield(experiment_obj, 'track') && ~isempty(experiment_obj.track)
                tracks = experiment_obj.track;
                fprintf('Found %d tracks in experiment\n', length(tracks));
                
                % Explore track structure for first track to identify available fields
                if length(tracks) > 0
                    fprintf('\n=== EXPLORING TRACK STRUCTURE ===\n');
                    explore_track_fields(tracks(1), 1);
                    fprintf('=====================================\n\n');
                end
                
                for track_idx = 1:length(tracks)
                    track = tracks(track_idx);
                    
                    % Extract trajectory coordinates for this track
                    trajectory_data = extract_track_coordinates(track, frame_times, exp_idx, track_idx, global_track_id);
                    
                    if ~isempty(trajectory_data)
                        % Save to HDF5 file
                        save_trajectory_to_h5(output_file, trajectory_data, global_track_id);
                        
                        total_tracks_processed = total_tracks_processed + 1;
                        global_track_id = global_track_id + 1;
                        
                        if mod(track_idx, 5) == 0
                            fprintf('  Processed %d/%d tracks in experiment %d\n', track_idx, length(tracks), exp_idx);
                        end
                    end
                end
                
                % Store experiment metadata
                experiment_metadata.(sprintf('experiment_%d', exp_idx)) = struct();
                experiment_metadata.(sprintf('experiment_%d', exp_idx)).name = exp.name;
                experiment_metadata.(sprintf('experiment_%d', exp_idx)).file = exp.file;
                experiment_metadata.(sprintf('experiment_%d', exp_idx)).track_count = length(tracks);
                experiment_metadata.(sprintf('experiment_%d', exp_idx)).frame_count = length(frame_times);
                
                fprintf('Successfully processed experiment %d with %d tracks\n', exp_idx, length(tracks));
                
            else
                fprintf('WARNING: No tracks found in experiment %s\n', exp.name);
            end
            
        catch ME
            fprintf('ERROR processing experiment %s: %s\n', exp.name, ME.message);
            continue;
        end
    end
    
    % Save metadata to HDF5 file
    save_metadata_to_h5(output_file, experiment_metadata, total_tracks_processed);
    
    % Display summary
    fprintf('\n=== TRAJECTORY EXTRACTION COMPLETE ===\n');
    fprintf('Total tracks processed: %d\n', total_tracks_processed);
    fprintf('Output file: %s\n', output_file);
    
    % Get file size
    file_info = dir(output_file);
    if ~isempty(file_info)
        fprintf('File size: %.2f MB\n', file_info.bytes / 1024 / 1024);
    end
    
    % Display HDF5 structure
    fprintf('\nHDF5 file structure:\n');
    try
        h5disp(output_file);
    catch
        fprintf('Could not display HDF5 structure\n');
    end
end

function explore_track_fields(track, track_idx)
    % Explore and display all fields in a track structure
    
    fprintf('Track %d structure exploration:\n', track_idx);
    fprintf('Track class: %s\n', class(track));
    
    if isstruct(track)
        field_names = fieldnames(track);
        fprintf('Available fields (%d total):\n', length(field_names));
        
        for i = 1:length(field_names)
            field_name = field_names{i};
            field_data = track.(field_name);
            
            if isnumeric(field_data) && ~isempty(field_data)
                fprintf('  %s: %s [%s] - %s\n', field_name, mat2str(size(field_data)), class(field_data), get_data_description(field_data));
            elseif iscell(field_data) && ~isempty(field_data)
                fprintf('  %s: cell array {%d elements}\n', field_name, length(field_data));
                if length(field_data) > 0 && isnumeric(field_data{1})
                    fprintf('    First cell: %s [%s]\n', mat2str(size(field_data{1})), class(field_data{1}));
                end
            elseif isstruct(field_data)
                sub_fields = fieldnames(field_data);
                fprintf('  %s: struct with %d fields (%s)\n', field_name, length(sub_fields), strjoin(sub_fields, ', '));
            elseif isempty(field_data)
                fprintf('  %s: empty\n', field_name);
            else
                fprintf('  %s: %s [%s]\n', field_name, mat2str(size(field_data)), class(field_data));
            end
        end
        
        % Look for coordinate-like fields specifically
        fprintf('\nCoordinate-like fields analysis:\n');
        coordinate_fields = {};
        for i = 1:length(field_names)
            field_name = field_names{i};
            field_data = track.(field_name);
            
            % Check if field looks like coordinates (Nx2 or Nx3 numeric)
            if isnumeric(field_data) && ~isempty(field_data) && size(field_data, 2) >= 2 && size(field_data, 2) <= 3
                coordinate_fields{end+1} = field_name;
                fprintf('  %s: %d points x %d dims (likely coordinates)\n', field_name, size(field_data, 1), size(field_data, 2));
            elseif iscell(field_data) && ~isempty(field_data)
                % Check if cell array contains coordinate matrices
                if isnumeric(field_data{1}) && size(field_data{1}, 2) >= 2 && size(field_data{1}, 2) <= 3
                    coordinate_fields{end+1} = field_name;
                    fprintf('  %s: cell array with coordinate matrices (%d cells, first: %dx%d)\n', ...
                        field_name, length(field_data), size(field_data{1}, 1), size(field_data{1}, 2));
                end
            end
        end
        
        if isempty(coordinate_fields)
            fprintf('  No obvious coordinate fields found\n');
        end
        
    elseif isobject(track)
        % Handle track objects (like MaggotTrack class)
        fprintf('Track is an object of class: %s\n', class(track));
        
        % Try to get properties
        try
            props = properties(track);
            fprintf('Available properties (%d total):\n', length(props));
            
            for i = 1:length(props)
                prop_name = props{i};
                try
                    prop_data = track.(prop_name);
                    
                    if isnumeric(prop_data) && ~isempty(prop_data)
                        fprintf('  %s: %s [%s] - %s\n', prop_name, mat2str(size(prop_data)), class(prop_data), get_data_description(prop_data));
                    elseif iscell(prop_data) && ~isempty(prop_data)
                        fprintf('  %s: cell array {%d elements}\n', prop_name, length(prop_data));
                    elseif isstruct(prop_data)
                        sub_fields = fieldnames(prop_data);
                        fprintf('  %s: struct with %d fields (%s)\n', prop_name, length(sub_fields), strjoin(sub_fields, ', '));
                    elseif isempty(prop_data)
                        fprintf('  %s: empty\n', prop_name);
                    else
                        fprintf('  %s: %s [%s]\n', prop_name, mat2str(size(prop_data)), class(prop_data));
                    end
                catch
                    fprintf('  %s: (could not access)\n', prop_name);
                end
            end
        catch
            fprintf('Could not get properties of track object\n');
        end
        
        % Try to get methods
        try
            methods_list = methods(track);
            fprintf('Available methods: %s\n', strjoin(methods_list, ', '));
        catch
            fprintf('Could not get methods of track object\n');
        end
    end
end

function description = get_data_description(data)
    % Get a brief description of numerical data
    
    if isempty(data)
        description = 'empty';
    elseif size(data, 2) == 1
        description = sprintf('vector (range: %.2f to %.2f)', min(data), max(data));
    elseif size(data, 2) == 2
        description = sprintf('2D coordinates (x: %.1f-%.1f, y: %.1f-%.1f)', ...
            min(data(:,1)), max(data(:,1)), min(data(:,2)), max(data(:,2)));
    elseif size(data, 2) == 3
        description = sprintf('3D coordinates (x: %.1f-%.1f, y: %.1f-%.1f, z: %.1f-%.1f)', ...
            min(data(:,1)), max(data(:,1)), min(data(:,2)), max(data(:,2)), min(data(:,3)), max(data(:,3)));
    else
        description = sprintf('matrix (range: %.2f to %.2f)', min(data(:)), max(data(:)));
    end
end

function exp_field = find_experiment_field(experiment_data)
    % Find the field containing the experiment object
    
    possible_fields = {'experiment', 'exp', 'expt', 'data', 'track_data'};
    exp_field = '';
    
    for field = possible_fields
        if isfield(experiment_data, field{1})
            exp_field = field{1};
            break;
        end
    end
end

function trajectory_data = extract_track_coordinates(track, frame_times, exp_idx, track_idx, global_track_id)
    % Extract coordinates for a single track
    
    trajectory_data = struct();
    
    try
        % Get track frame indices
        if ~isfield(track, 'startInd') || ~isfield(track, 'endInd')
            fprintf('WARNING: Track %d missing frame indices\n', track_idx);
            return;
        end
        
        start_frame = track.startInd;
        end_frame = track.endInd;
        frame_count = end_frame - start_frame + 1;
        
        fprintf('    Track %d: frames %d-%d (%d frames)\n', track_idx, start_frame, end_frame, frame_count);
        
        % Extract timing information
        if ~isempty(frame_times) && end_frame <= length(frame_times)
            track_frame_times = frame_times(start_frame:end_frame);
            start_time = frame_times(start_frame);
            end_time = frame_times(end_frame);
            duration = end_time - start_time;
        else
            % Generate default timing if not available
            track_frame_times = (0:(frame_count-1)) * 0.05; % Assume 20 fps
            start_time = 0;
            end_time = (frame_count-1) * 0.05;
            duration = end_time;
            fprintf('    WARNING: Using default timing for track %d\n', track_idx);
        end
        
        % Initialize coordinate arrays for all possible body parts
        coordinate_data = struct();
        
        % Define possible coordinate field names to search for
        coordinate_fields = {
            'head', 'tail', 'center', 'centroid', 'mid', 'middle', 'spine', 'backbone', ...
            'contour', 'outline', 'boundary', 'edge', 'perimeter', ...
            'x', 'y', 'pos', 'position', 'coord', 'coordinates', ...
            'pt', 'points', 'landmarks', 'body', 'segment'
        };
        
        % Extract coordinates from all available fields
        extracted_fields = {};
        for field_name = coordinate_fields
            field_name = field_name{1};
            
            if isfield(track, field_name) && ~isempty(track.(field_name))
                coord_data = track.(field_name);
                
                % Handle different coordinate data structures
                [x_coords, y_coords, frame_ids, point_ids] = extract_coordinate_field(coord_data, frame_count, field_name);
                
                if ~isempty(x_coords)
                    coordinate_data.(field_name) = struct();
                    coordinate_data.(field_name).x = x_coords;
                    coordinate_data.(field_name).y = y_coords;
                    coordinate_data.(field_name).frame_ids = frame_ids;
                    coordinate_data.(field_name).point_ids = point_ids;
                    coordinate_data.(field_name).num_points = length(x_coords);
                    
                    extracted_fields{end+1} = field_name;
                    fprintf('    %s coordinates: %d points\n', field_name, length(x_coords));
                end
            end
        end
        
        if isempty(extracted_fields)
            fprintf('    WARNING: No coordinate fields found for track %d\n', track_idx);
            return;
        end
        
        % Create trajectory data structure
        trajectory_data.metadata = struct();
        trajectory_data.metadata.global_track_id = global_track_id;
        trajectory_data.metadata.experiment_id = exp_idx;
        trajectory_data.metadata.local_track_id = track_idx;
        trajectory_data.metadata.start_frame = start_frame;
        trajectory_data.metadata.end_frame = end_frame;
        trajectory_data.metadata.frame_count = frame_count;
        trajectory_data.metadata.start_time = start_time;
        trajectory_data.metadata.end_time = end_time;
        trajectory_data.metadata.duration = duration;
        trajectory_data.metadata.extracted_fields = extracted_fields;
        trajectory_data.metadata.total_coordinate_points = 0;
        
        % Store timing data
        trajectory_data.timing = struct();
        trajectory_data.timing.frame_times = track_frame_times;
        trajectory_data.timing.frame_indices = start_frame:end_frame;
        
        % Store all coordinate data
        trajectory_data.coordinates = coordinate_data;
        
        % Calculate total points
        for field_name = extracted_fields
            trajectory_data.metadata.total_coordinate_points = trajectory_data.metadata.total_coordinate_points + ...
                coordinate_data.(field_name{1}).num_points;
        end
        
    catch ME
        fprintf('ERROR extracting coordinates for track %d: %s\n', track_idx, ME.message);
        trajectory_data = [];
    end
end

function [x_coords, y_coords, frame_ids, point_ids] = extract_coordinate_field(coord_data, frame_count, field_name)
    % Extract coordinates from a single field
    
    x_coords = [];
    y_coords = [];
    frame_ids = [];
    point_ids = [];
    
    try
        if iscell(coord_data)
            % Cell array (one cell per frame)
            for frame_idx = 1:min(length(coord_data), frame_count)
                frame_coords = coord_data{frame_idx};
                if ~isempty(frame_coords) && isnumeric(frame_coords) && size(frame_coords, 2) >= 2
                    num_points = size(frame_coords, 1);
                    
                    % Add coordinates for this frame
                    x_coords = [x_coords; frame_coords(:, 1)];
                    y_coords = [y_coords; frame_coords(:, 2)];
                    frame_ids = [frame_ids; repmat(frame_idx, num_points, 1)];
                    point_ids = [point_ids; (1:num_points)'];
                end
            end
            
        elseif isnumeric(coord_data) && size(coord_data, 2) >= 2
            % Numeric array
            x_coords = coord_data(:, 1);
            y_coords = coord_data(:, 2);
            
            if size(coord_data, 1) == frame_count
                % One point per frame
                frame_ids = (1:frame_count)';
                point_ids = ones(frame_count, 1);
            else
                % Multiple points (assume all from one frame or distributed)
                frame_ids = ones(size(x_coords));
                point_ids = (1:length(x_coords))';
            end
        end
        
        % Convert to double for HDF5 compatibility
        if ~isempty(x_coords)
            x_coords = double(x_coords);
            y_coords = double(y_coords);
            frame_ids = double(frame_ids);
            point_ids = double(point_ids);
        end
        
    catch ME
        fprintf('    ERROR extracting %s coordinates: %s\n', field_name, ME.message);
    end
end

function save_trajectory_to_h5(output_file, trajectory_data, global_track_id)
    % Save trajectory data to HDF5 file
    
    try
        track_group = sprintf('/tracks/track_%03d', global_track_id);
        
        % Save metadata
        metadata_group = [track_group '/metadata'];
        h5write_if_not_exists(output_file, [metadata_group '/global_track_id'], trajectory_data.metadata.global_track_id);
        h5write_if_not_exists(output_file, [metadata_group '/experiment_id'], trajectory_data.metadata.experiment_id);
        h5write_if_not_exists(output_file, [metadata_group '/local_track_id'], trajectory_data.metadata.local_track_id);
        h5write_if_not_exists(output_file, [metadata_group '/start_frame'], trajectory_data.metadata.start_frame);
        h5write_if_not_exists(output_file, [metadata_group '/end_frame'], trajectory_data.metadata.end_frame);
        h5write_if_not_exists(output_file, [metadata_group '/frame_count'], trajectory_data.metadata.frame_count);
        h5write_if_not_exists(output_file, [metadata_group '/start_time'], trajectory_data.metadata.start_time);
        h5write_if_not_exists(output_file, [metadata_group '/end_time'], trajectory_data.metadata.end_time);
        h5write_if_not_exists(output_file, [metadata_group '/duration'], trajectory_data.metadata.duration);
        h5write_if_not_exists(output_file, [metadata_group '/total_coordinate_points'], trajectory_data.metadata.total_coordinate_points);
        
        % Save timing data
        timing_group = [track_group '/timing'];
        if ~isempty(trajectory_data.timing.frame_times)
            h5write_if_not_exists(output_file, [timing_group '/frame_times'], trajectory_data.timing.frame_times);
        end
        if ~isempty(trajectory_data.timing.frame_indices)
            h5write_if_not_exists(output_file, [timing_group '/frame_indices'], trajectory_data.timing.frame_indices);
        end
        
        % Save all coordinate data
        coordinate_fields = fieldnames(trajectory_data.coordinates);
        for i = 1:length(coordinate_fields)
            field_name = coordinate_fields{i};
            field_data = trajectory_data.coordinates.(field_name);
            
            coord_group = [track_group '/coordinates/' field_name];
            h5write_if_not_exists(output_file, [coord_group '/x'], field_data.x);
            h5write_if_not_exists(output_file, [coord_group '/y'], field_data.y);
            h5write_if_not_exists(output_file, [coord_group '/frame_ids'], field_data.frame_ids);
            h5write_if_not_exists(output_file, [coord_group '/point_ids'], field_data.point_ids);
            h5write_if_not_exists(output_file, [coord_group '/num_points'], field_data.num_points);
        end
        
    catch ME
        fprintf('ERROR saving track %d to HDF5: %s\n', global_track_id, ME.message);
    end
end

function h5write_if_not_exists(filename, dataset_name, data)
    % Write to HDF5 dataset, creating it if it doesn't exist
    
    try
        % Check if dataset exists
        info = h5info(filename, dataset_name);
        % If we get here, dataset exists - delete and recreate
        % (HDF5 doesn't allow overwriting with different sizes)
    catch
        % Dataset doesn't exist or file doesn't exist - create it
    end
    
    try
        % Create dataset and write data
        if isnumeric(data)
            h5create(filename, dataset_name, size(data), 'Datatype', class(data));
        else
            % For non-numeric data, use default
            h5create(filename, dataset_name, size(data));
        end
        h5write(filename, dataset_name, data);
    catch ME
        % If creation fails, try just writing (might already exist)
        try
            h5write(filename, dataset_name, data);
        catch
            fprintf('WARNING: Could not write dataset %s: %s\n', dataset_name, ME.message);
        end
    end
end

function save_metadata_to_h5(output_file, experiment_metadata, total_tracks)
    % Save overall metadata to HDF5 file
    
    try
        % Save global metadata
        h5write_if_not_exists(output_file, '/metadata/total_tracks', total_tracks);
        h5write_if_not_exists(output_file, '/metadata/extraction_date', datestr(now, 'yyyy-mm-dd HH:MM:SS'));
        h5write_if_not_exists(output_file, '/metadata/data_type', 'trajectory_coordinates');
        h5write_if_not_exists(output_file, '/metadata/coordinate_units', 'pixels');
        
        % Save experiment metadata
        exp_names = fieldnames(experiment_metadata);
        for i = 1:length(exp_names)
            exp_data = experiment_metadata.(exp_names{i});
            exp_group = sprintf('/metadata/experiments/%s', exp_names{i});
            
            h5write_if_not_exists(output_file, [exp_group '/track_count'], exp_data.track_count);
            h5write_if_not_exists(output_file, [exp_group '/frame_count'], exp_data.frame_count);
        end
        
    catch ME
        fprintf('WARNING: Could not save metadata: %s\n', ME.message);
    end
end 