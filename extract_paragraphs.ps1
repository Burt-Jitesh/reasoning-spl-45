# Extract video URLs and PDF URLs in order from the document
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

# Process paragraphs - combine text from hyperlinks and runs within same paragraph
$paragraphs = $doc.SelectNodes("//w:p", $ns)
$entries = @()

foreach ($para in $paragraphs) {
    $hyperlinks = $para.SelectNodes(".//w:hyperlink", $ns)
    if ($hyperlinks.Count -eq 0) { continue }
    
    # Get the full paragraph text
    $allText = ""
    $urls = @()
    
    foreach ($child in $para.ChildNodes) {
        if ($child.LocalName -eq "hyperlink") {
            $rId = $child.GetAttribute("r:id")
            if ($rId -and $urlMap.ContainsKey($rId)) {
                $urls += $urlMap[$rId]
            }
            $textNodes = $child.SelectNodes(".//w:t", $ns)
            foreach ($t in $textNodes) {
                $allText += $t.InnerText
            }
        }
        elseif ($child.LocalName -eq "r") {
            $textNodes = $child.SelectNodes(".//w:t", $ns)
            foreach ($t in $textNodes) {
                $allText += $t.InnerText
            }
        }
    }
    
    $allText = $allText.Trim()
    if ($allText -and $urls.Count -gt 0) {
        # Categorize: pick the first meaningful URL
        $videoUrl = $urls | Where-Object { $_ -like '*brightcove*' -or $_ -like '*m3u8*' -or $_ -like '*youtube*' } | Select-Object -First 1
        $pdfUrl = $urls | Where-Object { $_ -like '*.pdf*' } | Select-Object -First 1
        
        if ($videoUrl) {
            $entries += [PSCustomObject]@{
                Title = $allText
                Url = $videoUrl
                Type = if ($videoUrl -like '*youtube*') { "youtube" } else { "video" }
            }
        }
        if ($pdfUrl) {
            $entries += [PSCustomObject]@{
                Title = $allText
                Url = $pdfUrl
                Type = "pdf"
            }
        }
    }
}

Write-Output "Total paragraph entries: $($entries.Count)"
$videos = $entries | Where-Object { $_.Type -eq 'video' -or $_.Type -eq 'youtube' }
$pdfs = $entries | Where-Object { $_.Type -eq 'pdf' }
Write-Output "Video entries: $($videos.Count)"
Write-Output "PDF entries: $($pdfs.Count)"

Write-Output ""
Write-Output "=== FIRST 20 VIDEO TITLES ==="
$videos | Select-Object -First 20 | ForEach-Object { Write-Output $_.Title }

Write-Output ""
Write-Output "=== FIRST 20 PDF TITLES ==="
$pdfs | Select-Object -First 20 | ForEach-Object { Write-Output $_.Title }

# Export everything
$jsonData = @{
    videos = @($videos | ForEach-Object { @{ title = $_.Title; url = $_.Url; type = $_.Type } })
    pdfs = @($pdfs | ForEach-Object { @{ title = $_.Title; url = $_.Url } })
}

$jsonData | ConvertTo-Json -Depth 4 | Out-File -FilePath 'c:\Users\jites\Documents\Google Antigravity\Govtweb\course_data.json' -Encoding UTF8
Write-Output "Exported to course_data.json"
