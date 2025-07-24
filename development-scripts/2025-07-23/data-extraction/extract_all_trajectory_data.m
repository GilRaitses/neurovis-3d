function extract_all_trajectory_data()
    % EXTRACT ALL TRAJECTORY DATA FROM MAT FILES
    % Comprehensive extraction and export to HDF5 for web visualization
    
    fprintf('🔍 MATLAB TRAJECTORY DATA EXTRACTION\n');
    fprintf('=====================================\n');
    
    % Add required paths
    addpath(genpath('D:\magniphyq\codebase\Matlab-Track-Analysis-SkanataLab'));
    
    % Define paths
    data_dir = 'D:\neurovis-3d\src\assets\data\trajectories';
    output_dir = 'D:\neurovis-3d\src\assets\data';
    
    % Find all MAT files
    mat_files = dir(fullfile(data_dir, '*.mat'));
    
    if isempty(mat_files)
        fprintf('❌ No .mat files found in %s\n', data_dir);
        return;
    end
    
    fprintf('📁 Found %d .mat files:\n', length(mat_files));
    for i = 1:length(mat_files)
        fprintf('   - %s\n', mat_files(i).name);
    end
    
    % Process all files
    all_data = {};
    extraction_summary = struct();
    
    for i = 1:length(mat_files)
        filepath = fullfile(data_dir, mat_files(i).name);
        fprintf('\n🔍 Processing: %s\n', mat_files(i).name);
        
        try
            % Load the MAT file
            data = load(filepath);
            
            % Analyze structure
            analysis = analyze_matlab_structure(data, mat_files(i).name);
            
            % Extract trajectory coordinates
            coordinates = extract_trajectory_coordinates(data);
            
            % Extract timing information
            timing = extract_timing_data(data);
            
            % Store results
            file_data = struct();
            file_data.filename = mat_files(i).name;
            file_data.filepath = filepath;
            file_data.analysis = analysis;
            file_data.coordinates = coordinates;
            file_data.timing = timing;
            file_data.raw_data = data;
            file_data.success = true;
            
            all_data{end+1} = file_data;
            
            fprintf('   ✅ Success: %d coordinate fields, %d timing fields\n', ...
                length(fieldnames(coordinates)), length(fieldnames(timing)));
            
        catch ME
            fprintf('   ❌ Error: %s\n', ME.message);
            
            file_data = struct();
            file_data.filename = mat_files(i).name;
            file_data.filepath = filepath;
            file_data.success = false;
            file_data.error = ME.message;
            
            all_data{end+1} = file_data;
        end
    end
    
    % Export to HDF5
    timestamp = datestr(now, 'yyyy-mm-dd_HH-MM-SS');
    h5_filename = sprintf('trajectory_data_matlab_%s.h5', timestamp);
    h5_filepath = fullfile(output_dir, h5_filename);
    
    fprintf('\n💾 Exporting to HDF5: %s\n', h5_filename);
    export_to_hdf5_matlab(all_data, h5_filepath);
    
    % Generate HTML summary
    html_filename = sprintf('trajectory_matlab_summary_%s.html', timestamp);
    html_filepath = fullfile(output_dir, html_filename);
    
    fprintf('📄 Generating HTML summary: %s\n', html_filename);
    generate_html_summary_matlab(all_data, html_filepath);
    
    % Generate JSON index
    json_filename = sprintf('trajectory_matlab_index_%s.json', timestamp);
    json_filepath = fullfile(output_dir, json_filename);
    
    fprintf('📋 Generating JSON index: %s\n', json_filename);
    generate_json_index_matlab(all_data, json_filepath);
    
    fprintf('\n🎉 MATLAB EXTRACTION COMPLETE!\n');
    fprintf('================================\n');
    fprintf('📊 Files processed: %d\n', length(all_data));
    
    % Count successful extractions
    successful_count = 0;
    for i = 1:length(all_data)
        if all_data{i}.success
            successful_count = successful_count + 1;
        end
    end
    fprintf('✅ Successful: %d\n', successful_count);
    
    fprintf('\n📁 Output files:\n');
    fprintf('   HDF5: %s\n', h5_filepath);
    fprintf('   HTML: %s\n', html_filepath);
    fprintf('   JSON: %s\n', json_filepath);
end

function analysis = analyze_matlab_structure(data, filename)
    % Analyze MATLAB data structure recursively
    
    analysis = struct();
    analysis.filename = filename;
    analysis.top_level_fields = fieldnames(data);
    analysis.field_analysis = struct();
    
    fprintf('   📊 Analyzing structure...\n');
    
    for i = 1:length(analysis.top_level_fields)
        field_name = analysis.top_level_fields{i};
        field_data = data.(field_name);
        
        field_info = struct();
        field_info.name = field_name;
        field_info.class = class(field_data);
        field_info.size = size(field_data);
        field_info.is_trajectory_related = false;
        field_info.coordinate_potential = false;
        
        % Check if field looks trajectory-related
        trajectory_keywords = {'track', 'trajectory', 'experiment', 'data', 'results', ...
                              'head', 'tail', 'center', 'spine', 'contour', 'coord'};
        
        for j = 1:length(trajectory_keywords)
            if contains(lower(field_name), trajectory_keywords{j})
                field_info.is_trajectory_related = true;
                break;
            end
        end
        
        % Check for coordinate potential
        coord_keywords = {'x', 'y', 'head', 'tail', 'center', 'spine', 'contour'};
        for j = 1:length(coord_keywords)
            if contains(lower(field_name), coord_keywords{j})
                field_info.coordinate_potential = true;
                break;
            end
        end
        
        % Detailed analysis for different data types
        if isstruct(field_data)
            field_info.subfields = fieldnames(field_data);
            field_info.description = sprintf('Struct with %d fields', length(field_info.subfields));
        elseif iscell(field_data)
            field_info.description = sprintf('Cell array: %dx%d', size(field_data, 1), size(field_data, 2));
        elseif isnumeric(field_data)
            if numel(field_data) <= 10
                field_info.description = sprintf('Numeric: %s', mat2str(field_data));
            else
                field_info.description = sprintf('Numeric array: min=%.3f, max=%.3f, mean=%.3f', ...
                    min(field_data(:)), max(field_data(:)), mean(field_data(:)));
            end
        elseif ischar(field_data) || isstring(field_data)
            field_info.description = sprintf('String: %s', string(field_data));
        else
            field_info.description = sprintf('Unknown type: %s', class(field_data));
        end
        
        analysis.field_analysis.(field_name) = field_info;
        
        if field_info.is_trajectory_related
            fprintf('      🎯 Trajectory field: %s (%s)\n', field_name, field_info.description);
        end
        if field_info.coordinate_potential
            fprintf('      📍 Coordinate field: %s (%s)\n', field_name, field_info.description);
        end
    end
end

function coordinates = extract_trajectory_coordinates(data)
    % Extract coordinate data from MATLAB structure
    
    coordinates = struct();
    coord_count = 0;
    
    function extract_coords_recursive(obj, path)
        if isstruct(obj)
            fields = fieldnames(obj);
            for i = 1:length(fields)
                field_name = fields{i};
                field_path = [path '.' field_name];
                
                % Check if field name suggests coordinates
                coord_keywords = {'x', 'y', 'head', 'tail', 'center', 'centroid', ...
                                 'spine', 'contour', 'coord', 'position', 'location'};
                
                is_coordinate = false;
                for j = 1:length(coord_keywords)
                    if contains(lower(field_name), coord_keywords{j})
                        is_coordinate = true;
                        break;
                    end
                end
                
                if is_coordinate && isnumeric(obj.(field_name)) && ~isempty(obj.(field_name))
                    coord_name = strrep(field_path, '.', '_');
                    coordinates.(coord_name) = obj.(field_name);
                    coord_count = coord_count + 1;
                    fprintf('      📍 Found coordinates: %s (shape: %s)\n', ...
                        coord_name, mat2str(size(obj.(field_name))));
                end
                
                % Recurse into nested structures
                extract_coords_recursive(obj.(field_name), field_path);
            end
        elseif iscell(obj)
            for i = 1:numel(obj)
                cell_path = sprintf('%s{%d}', path, i);
                extract_coords_recursive(obj{i}, cell_path);
            end
        end
    end
    
    % Start recursive extraction
    extract_coords_recursive(data, '');
    
    fprintf('   📍 Total coordinates extracted: %d\n', coord_count);
end

function timing = extract_timing_data(data)
    % Extract timing information from MATLAB structure
    
    timing = struct();
    timing_count = 0;
    
    function extract_timing_recursive(obj, path)
        if isstruct(obj)
            fields = fieldnames(obj);
            for i = 1:length(fields)
                field_name = fields{i};
                field_path = [path '.' field_name];
                
                % Check if field name suggests timing
                timing_keywords = {'time', 'frame', 'elapsed', 'duration', 'timestamp', ...
                                  'fps', 'frequency', 'rate', 'interval'};
                
                is_timing = false;
                for j = 1:length(timing_keywords)
                    if contains(lower(field_name), timing_keywords{j})
                        is_timing = true;
                        break;
                    end
                end
                
                if is_timing && isnumeric(obj.(field_name)) && ~isempty(obj.(field_name))
                    timing_name = strrep(field_path, '.', '_');
                    timing.(timing_name) = obj.(field_name);
                    timing_count = timing_count + 1;
                    fprintf('      ⏰ Found timing: %s (shape: %s)\n', ...
                        timing_name, mat2str(size(obj.(field_name))));
                end
                
                % Recurse into nested structures
                extract_timing_recursive(obj.(field_name), field_path);
            end
        elseif iscell(obj)
            for i = 1:numel(obj)
                cell_path = sprintf('%s{%d}', path, i);
                extract_timing_recursive(obj{i}, cell_path);
            end
        end
    end
    
    % Start recursive extraction
    extract_timing_recursive(data, '');
    
    fprintf('   ⏰ Total timing fields extracted: %d\n', timing_count);
end

function export_to_hdf5_matlab(all_data, output_path)
    % Export extracted data to HDF5 format
    
    % Delete existing file if it exists
    if exist(output_path, 'file')
        delete(output_path);
    end
    
    % Create metadata
    h5create(output_path, '/metadata/extraction_date', [1 1], 'Datatype', 'string');
    h5write(output_path, '/metadata/extraction_date', string(datestr(now, 'yyyy-mm-ddTHH:MM:SS')));
    
    h5create(output_path, '/metadata/total_files', [1 1]);
    h5write(output_path, '/metadata/total_files', length(all_data));
    
    % Count successful files
    successful_files = 0;
    for i = 1:length(all_data)
        if all_data{i}.success
            successful_files = successful_files + 1;
        end
    end
    h5create(output_path, '/metadata/successful_files', [1 1]);
    h5write(output_path, '/metadata/successful_files', successful_files);
    
    % Export data from each file
    for i = 1:length(all_data)
        file_data = all_data{i};
        
        if ~file_data.success
            continue;
        end
        
        file_group = sprintf('/file_%02d_%s', i, strrep(file_data.filename, '.mat', ''));
        
        % Export coordinates
        if isfield(file_data, 'coordinates') && ~isempty(fieldnames(file_data.coordinates))
            coord_fields = fieldnames(file_data.coordinates);
            for j = 1:length(coord_fields)
                coord_name = coord_fields{j};
                coord_data = file_data.coordinates.(coord_name);
                
                dataset_path = sprintf('%s/coordinates/%s', file_group, coord_name);
                
                try
                    h5create(output_path, dataset_path, size(coord_data));
                    h5write(output_path, dataset_path, coord_data);
                    
                    % Add attributes
                    h5writeatt(output_path, dataset_path, 'description', ...
                        sprintf('Coordinate data: %s', coord_name));
                    h5writeatt(output_path, dataset_path, 'source_file', file_data.filename);
                    
                catch ME
                    fprintf('     ⚠️  Could not export coordinate %s: %s\n', coord_name, ME.message);
                end
            end
        end
        
        % Export timing data
        if isfield(file_data, 'timing') && ~isempty(fieldnames(file_data.timing))
            timing_fields = fieldnames(file_data.timing);
            for j = 1:length(timing_fields)
                timing_name = timing_fields{j};
                timing_data = file_data.timing.(timing_name);
                
                dataset_path = sprintf('%s/timing/%s', file_group, timing_name);
                
                try
                    h5create(output_path, dataset_path, size(timing_data));
                    h5write(output_path, dataset_path, timing_data);
                    
                    % Add attributes
                    h5writeatt(output_path, dataset_path, 'description', ...
                        sprintf('Timing data: %s', timing_name));
                    h5writeatt(output_path, dataset_path, 'source_file', file_data.filename);
                    
                catch ME
                    fprintf('     ⚠️  Could not export timing %s: %s\n', timing_name, ME.message);
                end
            end
        end
    end
    
    fprintf('   ✅ HDF5 export completed\n');
end

function generate_html_summary_matlab(all_data, output_path)
    % Generate HTML summary of extracted data
    
    fid = fopen(output_path, 'w');
    
    % HTML header
    fprintf(fid, '<!DOCTYPE html>\n<html lang="en">\n<head>\n');
    fprintf(fid, '<meta charset="UTF-8">\n');
    fprintf(fid, '<title>MATLAB Trajectory Data Extraction</title>\n');
    fprintf(fid, '<style>\n');
    fprintf(fid, 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n');
    fprintf(fid, '.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }\n');
    fprintf(fid, 'h1 { color: #2c3e50; border-bottom: 3px solid #3498db; }\n');
    fprintf(fid, '.file-section { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 8px; }\n');
    fprintf(fid, '.success { border-left: 4px solid #27ae60; }\n');
    fprintf(fid, '.error { border-left: 4px solid #e74c3c; }\n');
    fprintf(fid, '.coordinate { background: #fff3cd; padding: 8px; margin: 5px 0; border-radius: 4px; }\n');
    fprintf(fid, '.timing { background: #cce5ff; padding: 8px; margin: 5px 0; border-radius: 4px; }\n');
    fprintf(fid, 'code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }\n');
    fprintf(fid, '</style>\n</head>\n<body>\n');
    
    % HTML body
    fprintf(fid, '<div class="container">\n');
    fprintf(fid, '<h1>🎯 MATLAB Trajectory Data Extraction</h1>\n');
    fprintf(fid, '<p>Generated: %s</p>\n', datestr(now));
    
    % Summary statistics
    total_files = length(all_data);
    successful_files = 0;
    for i = 1:length(all_data)
        if all_data{i}.success
            successful_files = successful_files + 1;
        end
    end
    
    fprintf(fid, '<h2>📊 Summary</h2>\n');
    fprintf(fid, '<p>Total files: %d | Successful: %d | Failed: %d</p>\n', ...
        total_files, successful_files, total_files - successful_files);
    
    % File details
    for i = 1:length(all_data)
        file_data = all_data{i};
        
        if file_data.success
            section_class = 'file-section success';
            status_icon = '✅';
        else
            section_class = 'file-section error';
            status_icon = '❌';
        end
        
        fprintf(fid, '<div class="%s">\n', section_class);
        fprintf(fid, '<h3>%s %s</h3>\n', status_icon, file_data.filename);
        fprintf(fid, '<p><strong>Path:</strong> <code>%s</code></p>\n', file_data.filepath);
        
        if file_data.success
            % Coordinates
            if isfield(file_data, 'coordinates') && ~isempty(fieldnames(file_data.coordinates))
                coord_fields = fieldnames(file_data.coordinates);
                fprintf(fid, '<h4>📍 Coordinates (%d fields)</h4>\n', length(coord_fields));
                for j = 1:length(coord_fields)
                    coord_name = coord_fields{j};
                    coord_data = file_data.coordinates.(coord_name);
                    fprintf(fid, '<div class="coordinate">%s: %s</div>\n', ...
                        coord_name, mat2str(size(coord_data)));
                end
            end
            
            % Timing
            if isfield(file_data, 'timing') && ~isempty(fieldnames(file_data.timing))
                timing_fields = fieldnames(file_data.timing);
                fprintf(fid, '<h4>⏰ Timing (%d fields)</h4>\n', length(timing_fields));
                for j = 1:length(timing_fields)
                    timing_name = timing_fields{j};
                    timing_data = file_data.timing.(timing_name);
                    fprintf(fid, '<div class="timing">%s: %s</div>\n', ...
                        timing_name, mat2str(size(timing_data)));
                end
            end
        else
            fprintf(fid, '<p><strong>Error:</strong> %s</p>\n', file_data.error);
        end
        
        fprintf(fid, '</div>\n');
    end
    
    fprintf(fid, '</div>\n</body>\n</html>\n');
    fclose(fid);
    
    fprintf('   ✅ HTML summary generated\n');
end

function generate_json_index_matlab(all_data, output_path)
    % Generate JSON index for programmatic access
    
    index = struct();
    index.extraction_date = datestr(now, 'yyyy-mm-ddTHH:MM:SS');
    index.total_files = length(all_data);
    
    % Count successful files
    successful_count = 0;
    for i = 1:length(all_data)
        if all_data{i}.success
            successful_count = successful_count + 1;
        end
    end
    index.successful_files = successful_count;
    
    index.files = {};
    for i = 1:length(all_data)
        file_info = struct();
        file_info.filename = all_data{i}.filename;
        file_info.success = all_data{i}.success;
        
        if all_data{i}.success
            if isfield(all_data{i}, 'coordinates')
                file_info.coordinate_fields = fieldnames(all_data{i}.coordinates);
            else
                file_info.coordinate_fields = {};
            end
            
            if isfield(all_data{i}, 'timing')
                file_info.timing_fields = fieldnames(all_data{i}.timing);
            else
                file_info.timing_fields = {};
            end
        else
            file_info.error = all_data{i}.error;
        end
        
        index.files{end+1} = file_info;
    end
    
    % Write JSON
    json_str = jsonencode(index, 'PrettyPrint', true);
    fid = fopen(output_path, 'w');
    fprintf(fid, '%s', json_str);
    fclose(fid);
    
    fprintf('   ✅ JSON index generated\n');
end 