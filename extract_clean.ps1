# Clean extraction - output separate title and URL for each entry
[xml]$rels = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\docx_temp\word\_rels\document.xml.rels'
[xml]$doc = Get-Content 'c:\Users\jites\Documents\Google Antigravity\Govtweb\docx_temp\word\document.xml'

$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$ns.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")

# Build URL lookup
$urlMap = @{}
$rels.Relationships.Relationship | Where-Object { $_.Type -like '*hyperlink*' } | ForEach-Object {
    $urlMap[$_.Id] = $_.Target
}

# Process paragraphs
$paragraphs = $doc.SelectNodes("//w:p", $ns)
$videos = [System.Collections.ArrayList]::new()
$pdfs = [System.Collections.ArrayList]::new()

foreach ($para in $paragraphs) {
    $hyperlinks = $para.SelectNodes(".//w:hyperlink", $ns)
    if ($hyperlinks.Count -eq 0) { continue }
    
    # Get the full paragraph text and URLs
    $allText = ""
    $videoUrl = $null
    $pdfUrl = $null
    $ytUrl = $null
    
    foreach ($child in $para.ChildNodes) {
        if ($child.LocalName -eq "hyperlink") {
            $rId = $child.GetAttribute("r:id")
            if ($rId -and $urlMap.ContainsKey($rId)) {
                $url = $urlMap[$rId]
                if ($url -like '*brightcove*' -or $url -like '*m3u8*') {
                    if (-not $videoUrl) { $videoUrl = $url }
                }
                elseif ($url -like '*youtube*') {
                    if (-not $ytUrl) { $ytUrl = $url }
                }
                elseif ($url -like '*.pdf*') {
                    if (-not $pdfUrl) { $pdfUrl = $url }
                }
            }
            $textNodes = $child.SelectNodes(".//w:t", $ns)
            foreach ($t in $textNodes) {
                $val = $t.InnerText
                # Skip text that looks like a URL
                if ($val -notlike '*edge.api*' -and $val -notlike '*brightcove*' -and $val -notlike '*m3u8*' -and $val -notlike '*cwmediabkt*' -and $val -notlike '*crwilladmin*' -and $val -notlike '*bcov_auth*' -and $val.Length -lt 200) {
                    $allText += $val
                }
            }
        }
        elseif ($child.LocalName -eq "r") {
            $textNodes = $child.SelectNodes(".//w:t", $ns)
            foreach ($t in $textNodes) {
                $val = $t.InnerText
                if ($val -notlike '*edge.api*' -and $val -notlike '*brightcove*' -and $val.Length -lt 200) {
                    $allText += $val
                }
            }
        }
    }
    
    $allText = $allText.Trim()
    # Clean up the title - remove numbering dots at start like "1." "2." etc
    # But keep them for reference
    
    if ($allText -and ($videoUrl -or $ytUrl)) {
        $type = if ($ytUrl -and -not $videoUrl) { "youtube" } else { "video" }
        $url = if ($videoUrl) { $videoUrl } else { $ytUrl }
        [void]$videos.Add(@{
            title = $allText
            url = $url
            type = $type
        })
    }
    if ($allText -and $pdfUrl) {
        [void]$pdfs.Add(@{
            title = $allText
            url = $pdfUrl
        })
    }
}

Write-Output "Videos: $($videos.Count)"
Write-Output "PDFs: $($pdfs.Count)"

# Export clean JSON
$output = @{
    videos = $videos
    pdfs = $pdfs
}

$json = $output | ConvertTo-Json -Depth 4 -Compress
[System.IO.File]::WriteAllText('c:\Users\jites\Documents\Google Antigravity\Govtweb\course_data_clean.json', $json, [System.Text.Encoding]::UTF8)

Write-Output "Exported to course_data_clean.json"

# Show first 10 video titles
Write-Output ""
Write-Output "=== FIRST 10 VIDEOS ==="
for ($i = 0; $i -lt [Math]::Min(10, $videos.Count); $i++) {
    Write-Output "$($i+1). $($videos[$i].title)"
}

Write-Output ""
Write-Output "=== FIRST 10 PDFs ==="
for ($i = 0; $i -lt [Math]::Min(10, $pdfs.Count); $i++) {
    Write-Output "$($i+1). $($pdfs[$i].title)"
}
