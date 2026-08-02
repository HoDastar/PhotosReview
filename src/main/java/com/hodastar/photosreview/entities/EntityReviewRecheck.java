package com.hodastar.photosreview.entities;

public class EntityReviewRecheck {
    public int photoid;
    public String proj;
    public String value;

    public EntityReviewRecheck(int photoid, String proj, String value) {
        this.photoid = photoid;
        this.proj = proj;
        this.value = value;
    }

    @Override
    public String toString() {
        return "EntityReviewPhotos{" +
                "photoid=" + photoid +
                ", proj='" + proj + '\'' +
                ", value='" + value + '\'' +
                '}';
    }
}
