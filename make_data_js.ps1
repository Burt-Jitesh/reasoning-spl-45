$json = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\course_data_clean.json' -Raw
$dataJs = "const globalCourseData = " + $json + ";"
[System.IO.File]::WriteAllText('c:\Users\jites\Documents\Google Antigravity\Govtweb\data.js', $dataJs, [System.Text.Encoding]::UTF8)
